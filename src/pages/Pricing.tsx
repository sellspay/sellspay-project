import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PricingModal } from "@/components/pricing/PricingModal";

/**
 * /pricing route — renders the new PricingModal as a standalone page.
 * The old long-form pricing page was replaced by the unified modal used
 * across Studio and AI Builder. Closing the modal returns the user home.
 */
export default function Pricing() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  // Lock background scroll while the modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Send the user back where they came from, or home as a fallback
      if (window.history.length > 1) navigate(-1);
      else navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <PricingModal open={open} onOpenChange={handleOpenChange} />
    </div>
  );
}
