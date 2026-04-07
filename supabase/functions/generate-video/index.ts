import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Credit costs per model
const MODEL_CREDITS: Record<string, number> = {
  "kling-2.6-pro": 50,
  "kling-3.0": 60,
  "kling-o3": 70,
  "kling-i2v": 50,
  "kling-3.0-i2v": 60,
  "kling-motion-control": 50,
  "veo-3.1": 80,
  "sora-2": 80,
  "grok-imagine-video": 60,
};

// Real Fal.ai model endpoints for each model
function resolveFalEndpoint(modelId: string, mode: string, hasImage: boolean, hasVideo: boolean, hasSourceVideo: boolean): string {
  // Motion transfer mode
  if (mode === "motion-transfer" && hasSourceVideo && hasVideo) {
    return "fal-ai/kling-video/v2/master/video-to-video";
  }

  // Video reference mode
  if (mode === "video-reference" && hasVideo) {
    return "fal-ai/kling-video/o1/video-to-video/reference";
  }

  // Model-specific routing
  switch (modelId) {
    // ── Kling 2.6 Pro (v2.5 turbo pro) ──
    case "kling-2.6-pro":
    case "kling-i2v":
      if (hasImage) return "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";
      return "fal-ai/kling-video/v2.5-turbo/pro/text-to-video";

    // ── Kling 3.0 (v3 pro) ──
    case "kling-3.0":
    case "kling-3.0-i2v":
      if (hasImage) return "fal-ai/kling-video/v3/pro/image-to-video";
      return "fal-ai/kling-video/v3/pro/text-to-video";

    // ── Kling O3 (omni 3 pro) ──
    case "kling-o3":
      if (hasImage) return "fal-ai/kling-video/o3/pro/image-to-video";
      return "fal-ai/kling-video/o3/pro/text-to-video";

    // ── Kling Motion Control ──
    case "kling-motion-control":
      return "fal-ai/kling-video/v2/master/video-to-video";

    // ── Veo 3.1 (via Fal.ai) ──
    case "veo-3.1":
      if (hasImage) return "fal-ai/veo3/image-to-video";
      return "fal-ai/veo3/text-to-video";

    // ── Sora 2 (via Fal.ai) ──
    case "sora-2":
      return "fal-ai/sora/text-to-video";

    // ── Grok Imagine Video — fallback to Kling O3 until xAI API available ──
    case "grok-imagine-video":
      if (hasImage) return "fal-ai/kling-video/o3/pro/image-to-video";
      return "fal-ai/kling-video/o3/pro/text-to-video";

    // Default fallback
    default:
      if (hasImage) return "fal-ai/kling-video/v2/master/image-to-video";
      return "fal-ai/kling-video/v2/master/text-to-video";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // ===== POLL MODE =====
    if (body.action === "poll" && body.request_id) {
      const { data: statusData } = await supabase
        .from("video_generation_queue")
        .select("status, result_url, error_message")
        .eq("id", body.request_id)
        .eq("user_id", user.id)
        .single();

      if (!statusData) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        status: statusData.status,
        video_url: statusData.result_url,
        error: statusData.error_message,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== SUBMIT MODE =====
    const { prompt, image_url, video_url, source_video_url, duration = "5", aspect_ratio = "16:9", mode = "image-to-video", model: requestedModel } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const VIDEO_COST = MODEL_CREDITS[requestedModel] ?? 50;

    // Credit check & deduct
    const { data: wallet } = await supabase
      .from("user_wallets").select("balance").eq("user_id", user.id).single();

    const currentBalance = wallet?.balance ?? 0;
    if (currentBalance < VIDEO_COST) {
      return new Response(JSON.stringify({
        error: "INSUFFICIENT_CREDITS",
        message: `Insufficient credits. You have ${currentBalance}, but this costs ${VIDEO_COST}.`,
        required: VIDEO_COST, available: currentBalance,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: deductSuccess, error: deductError } = await supabase.rpc("deduct_credits", {
      p_user_id: user.id, p_amount: VIDEO_COST, p_action: "video_gen",
    });

    if (deductError || !deductSuccess) {
      return new Response(JSON.stringify({ error: "INSUFFICIENT_CREDITS", message: "Insufficient credits." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: "Refund: FAL_KEY not configured" });
      return new Response(JSON.stringify({ error: "Video service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve the real Fal.ai endpoint
    const falModel = resolveFalEndpoint(
      requestedModel || "kling-2.6-pro",
      mode,
      !!image_url,
      !!video_url,
      !!source_video_url,
    );

    const requestBody: Record<string, unknown> = {
      prompt: prompt.trim(),
      duration,
      aspect_ratio,
    };

    // For motion-transfer mode: source video is the main video, reference guides motion
    if (mode === "motion-transfer" && source_video_url) {
      requestBody.video_url = source_video_url;
      if (video_url) requestBody.ref_video_url = video_url;
    } else if (mode === "video-reference" && video_url) {
      requestBody.video_url = video_url;
      if (image_url) requestBody.image_url = image_url;
    } else if (image_url) {
      requestBody.image_url = image_url;
    }

    // Create queue entry
    const { data: queueEntry, error: queueError } = await supabase
      .from("video_generation_queue")
      .insert({
        user_id: user.id,
        status: "processing",
        prompt: prompt.trim(),
        fal_model: falModel,
        request_body: requestBody,
      })
      .select("id")
      .single();

    if (queueError) {
      await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: "Refund: queue insert failed" });
      throw new Error("Failed to create generation request");
    }

    const requestId = queueEntry.id;

    console.log(`Submitting video: model=${requestedModel}, endpoint=${falModel}, requestId=${requestId}`);

    // Submit to fal.ai queue endpoint
    const queueResponse = await fetch(`https://queue.fal.run/${falModel}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!queueResponse.ok) {
      const errorText = await queueResponse.text();
      console.error("fal.ai queue submit error:", queueResponse.status, errorText);
      await supabase.from("video_generation_queue").update({ status: "failed", error_message: `fal.ai error: ${queueResponse.status}` }).eq("id", requestId);
      await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: `Refund: fal.ai queue submit failed (${queueResponse.status})` });
      throw new Error(`Video generation failed: ${queueResponse.status}`);
    }

    const queueResult = await queueResponse.json();
    const falRequestId = queueResult.request_id;
    const statusUrl = queueResult.status_url;
    const responseUrl = queueResult.response_url;
    console.log("fal.ai queued, request_id:", falRequestId, "status_url:", statusUrl);

    await supabase.from("video_generation_queue").update({
      fal_request_id: falRequestId,
    }).eq("id", requestId);

    // Poll fal.ai for completion
    const maxPollTime = 280_000;
    const pollInterval = 5_000;
    const startTime = Date.now();

    let videoUrl: string | null = null;

    while (Date.now() - startTime < maxPollTime) {
      await new Promise(r => setTimeout(r, pollInterval));

      try {
        const pollUrl = statusUrl || `https://queue.fal.run/${falModel}/requests/${falRequestId}/status`;
        const statusResponse = await fetch(pollUrl, {
          method: "GET",
          headers: { Authorization: `Key ${FAL_KEY}` },
        });

        if (!statusResponse.ok) {
          const txt = await statusResponse.text();
          console.log("Poll status error:", statusResponse.status, txt);
          continue;
        }

        const statusResult = await statusResponse.json();
        console.log("Poll status:", statusResult.status);

        if (statusResult.status === "COMPLETED") {
          const resultFetchUrl = responseUrl || `https://queue.fal.run/${falModel}/requests/${falRequestId}`;
          const resultResponse = await fetch(resultFetchUrl, {
            method: "GET",
            headers: { Authorization: `Key ${FAL_KEY}` },
          });

          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            videoUrl = resultData.video?.url;
            if (!videoUrl) {
              console.error("No video URL in result:", JSON.stringify(resultData).substring(0, 500));
              const errMsg = "Video generation completed but no video URL returned";
              await supabase.from("video_generation_queue").update({ status: "failed", error_message: errMsg }).eq("id", requestId);
              await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: "Refund: no video URL in result" });
              return new Response(JSON.stringify({ error: errMsg, request_id: requestId }), {
                status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          } else {
            const errTxt = await resultResponse.text();
            console.error("Result fetch error:", resultResponse.status, errTxt);
            let errMsg = `Video generation failed (${resultResponse.status})`;
            try {
              const errJson = JSON.parse(errTxt);
              if (errJson.detail?.[0]?.msg) errMsg = errJson.detail[0].msg;
            } catch {}
            await supabase.from("video_generation_queue").update({ status: "failed", error_message: errMsg }).eq("id", requestId);
            await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: `Refund: result fetch failed (${resultResponse.status})` });
            return new Response(JSON.stringify({ error: errMsg, request_id: requestId }), {
              status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          break;
        } else if (statusResult.status === "FAILED") {
          const errMsg = statusResult.error || "Video generation failed on provider";
          console.error("fal.ai job failed:", errMsg);
          await supabase.from("video_generation_queue").update({ status: "failed", error_message: errMsg }).eq("id", requestId);
          await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: VIDEO_COST, p_action: "refund", p_description: "Refund: fal.ai generation failed" });
          return new Response(JSON.stringify({ error: "Video generation failed", request_id: requestId }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (pollErr) {
        console.error("Poll error:", pollErr);
      }
    }

    if (!videoUrl) {
      await supabase.from("video_generation_queue").update({ status: "processing" }).eq("id", requestId);
      return new Response(JSON.stringify({
        status: "processing",
        request_id: requestId,
        message: "Video is still generating. Poll for status.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Success
    await supabase.from("video_generation_queue").update({ status: "completed", result_url: videoUrl }).eq("id", requestId);
    await supabase.from("tool_usage").insert({ user_id: user.id, tool_id: "video_gen" });

    const { data: newWallet } = await supabase
      .from("user_wallets").select("balance").eq("user_id", user.id).single();

    return new Response(JSON.stringify({
      success: true,
      status: "completed",
      video_url: videoUrl,
      request_id: requestId,
      model: requestedModel,
      endpoint: falModel,
      duration,
      credits_deducted: VIDEO_COST,
      remaining_credits: newWallet?.balance ?? 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Video generation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
