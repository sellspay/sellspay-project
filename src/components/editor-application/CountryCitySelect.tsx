import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface CountryCitySelectProps {
  country: string;
  city: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
}

// Comprehensive list of countries with major cities
const COUNTRIES_WITH_CITIES: Record<string, string[]> = {
  // Africa
  'Algeria': ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa', 'Sétif', 'Sidi Bel Abbès', 'Biskra'],
  'Angola': ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango', 'Malanje', 'Namibe', 'Soyo', 'Uíge'],
  'Benin': ['Cotonou', 'Porto-Novo', 'Parakou', 'Djougou', 'Bohicon', 'Kandi', 'Lokossa', 'Ouidah', 'Abomey', 'Natitingou'],
  'Botswana': ['Gaborone', 'Francistown', 'Molepolole', 'Serowe', 'Selibe Phikwe', 'Maun', 'Kanye', 'Mahalapye', 'Mogoditshane', 'Mochudi'],
  'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', 'Dédougou', 'Kaya', 'Tenkodogo', 'Fada N\'gourma', 'Houndé'],
  'Burundi': ['Bujumbura', 'Gitega', 'Muyinga', 'Ngozi', 'Rumonge', 'Makamba', 'Kayanza', 'Cibitoke', 'Bubanza', 'Rutana'],
  'Cameroon': ['Douala', 'Yaoundé', 'Garoua', 'Bamenda', 'Maroua', 'Bafoussam', 'Ngaoundéré', 'Bertoua', 'Loum', 'Kumba'],
  'Cape Verde': ['Praia', 'Mindelo', 'Santa Maria', 'Assomada', 'Pedra Badejo', 'Tarrafal', 'São Filipe', 'Sal Rei', 'Porto Novo', 'Espargos'],
  'Central African Republic': ['Bangui', 'Bimbo', 'Berbérati', 'Carnot', 'Bambari', 'Bouar', 'Bossangoa', 'Bria', 'Nola', 'Bangassou'],
  'Chad': ['N\'Djamena', 'Moundou', 'Sarh', 'Abéché', 'Kélo', 'Koumra', 'Pala', 'Am Timan', 'Bongor', 'Doba'],
  'Comoros': ['Moroni', 'Mutsamudu', 'Fomboni', 'Domoni', 'Tsimbeo', 'Adda-Douéni', 'Sima', 'Ouani', 'Mirontsi', 'Douniani'],
  'Congo (DRC)': ['Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kisangani', 'Kananga', 'Bukavu', 'Tshikapa', 'Kolwezi', 'Likasi', 'Goma'],
  'Congo (Republic)': ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Impfondo', 'Ouésso', 'Owando', 'Sibiti', 'Madingou', 'Kinkala'],
  'Côte d\'Ivoire': ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Gagnoa', 'Divo', 'Anyama'],
  'Djibouti': ['Djibouti', 'Ali Sabieh', 'Tadjoura', 'Obock', 'Dikhil', 'Arta', 'Holhol', 'Airolaf', 'Galafi', 'Loyada'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El-Mahalla El-Kubra', 'Tanta', 'Aswan', 'Ismailia', 'Faiyum', 'Zagazig', 'Hurghada'],
  'Equatorial Guinea': ['Malabo', 'Bata', 'Ebebiyín', 'Aconibe', 'Añisok', 'Luba', 'Evinayong', 'Mongomo', 'Mengomeyén', 'Niefang'],
  'Eritrea': ['Asmara', 'Keren', 'Massawa', 'Assab', 'Mendefera', 'Adi Keyh', 'Barentu', 'Teseney', 'Adi Quala', 'Dekemhare'],
  'Eswatini': ['Mbabane', 'Manzini', 'Lobamba', 'Siteki', 'Piggs Peak', 'Nhlangano', 'Big Bend', 'Simunye', 'Hluti', 'Bhunya'],
  'Ethiopia': ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Hawassa', 'Bahir Dar', 'Adama', 'Jimma', 'Dessie', 'Jijiga'],
  'Gabon': ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Lambaréné', 'Tchibanga', 'Koulamoutou', 'Makokou'],
  'Gambia': ['Banjul', 'Serekunda', 'Brikama', 'Bakau', 'Farafenni', 'Lamin', 'Nema Kunku', 'Sukuta', 'Gunjur', 'Basse Santa Su'],
  'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Ashaiman', 'Cape Coast', 'Obuasi', 'Tema', 'Madina', 'Koforidua'],
  'Guinea': ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labé', 'Guéckédou', 'Boké', 'Mamou', 'Faranah', 'Kissidougou'],
  'Guinea-Bissau': ['Bissau', 'Bafatá', 'Gabú', 'Bissorã', 'Bolama', 'Cacheu', 'Bubaque', 'Catió', 'Mansôa', 'Buba'],
  'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Ruiru', 'Kikuyu', 'Thika', 'Malindi', 'Naivasha', 'Nyeri', 'Machakos', 'Meru', 'Lamu', 'Garissa'],
  'Lesotho': ['Maseru', 'Teyateyaneng', 'Mafeteng', 'Hlotse', 'Mohale\'s Hoek', 'Maputsoe', 'Quthing', 'Qacha\'s Nek', 'Butha-Buthe', 'Roma'],
  'Liberia': ['Monrovia', 'Gbarnga', 'Kakata', 'Bensonville', 'Harper', 'Buchanan', 'Voinjama', 'Zwedru', 'Greenville', 'Tubmanburg'],
  'Libya': ['Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Al Khums', 'Zawiya', 'Zliten', 'Ajdabiya', 'Sirte', 'Sabha'],
  'Madagascar': ['Antananarivo', 'Toamasina', 'Antsirabe', 'Fianarantsoa', 'Mahajanga', 'Toliara', 'Antsiranana', 'Ambovombe', 'Antsohihy', 'Morondava'],
  'Malawi': ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi', 'Karonga', 'Salima', 'Nkhotakota', 'Liwonde'],
  'Mali': ['Bamako', 'Sikasso', 'Mopti', 'Koutiala', 'Ségou', 'Kayes', 'Gao', 'Kati', 'San', 'Koulikoro'],
  'Mauritania': ['Nouakchott', 'Nouadhibou', 'Néma', 'Kaédi', 'Rosso', 'Zouerate', 'Atar', 'Kiffa', 'Sélibaby', 'Aïoun el Atrouss'],
  'Mauritius': ['Port Louis', 'Beau Bassin-Rose Hill', 'Vacoas-Phoenix', 'Curepipe', 'Quatre Bornes', 'Triolet', 'Goodlands', 'Centre de Flacq', 'Bel Air Rivière Sèche', 'Mahébourg'],
  'Morocco': ['Casablanca', 'Rabat', 'Fez', 'Marrakech', 'Tangier', 'Meknes', 'Oujda', 'Agadir', 'Tétouan', 'Salé', 'Chefchaouen', 'Essaouira', 'Ouarzazate'],
  'Mozambique': ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio', 'Nacala', 'Quelimane', 'Tete', 'Xai-Xai', 'Pemba'],
  'Namibia': ['Windhoek', 'Walvis Bay', 'Swakopmund', 'Rundu', 'Oshakati', 'Katima Mulilo', 'Grootfontein', 'Rehoboth', 'Otjiwarongo', 'Okahandja'],
  'Niger': ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua', 'Dosso', 'Arlit', 'Tessaoua', 'Diffa', 'Gaya'],
  'Nigeria': ['Lagos', 'Kano', 'Ibadan', 'Kaduna', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Abeokuta', 'Abuja', 'Sokoto', 'Onitsha', 'Warri', 'Calabar', 'Uyo'],
  'Rwanda': ['Kigali', 'Butare', 'Gitarama', 'Ruhengeri', 'Gisenyi', 'Byumba', 'Cyangugu', 'Nyanza', 'Kibungo', 'Kibuye'],
  'São Tomé and Príncipe': ['São Tomé', 'Santo António', 'Neves', 'Santana', 'Trindade', 'Guadalupe', 'Angolares', 'Pantufo', 'Conde', 'Santa Catarina'],
  'Senegal': ['Dakar', 'Touba', 'Thiès', 'Rufisque', 'Kaolack', 'M\'Bour', 'Saint-Louis', 'Ziguinchor', 'Diourbel', 'Louga'],
  'Seychelles': ['Victoria', 'Anse Boileau', 'Beau Vallon', 'Anse Royale', 'Cascade', 'Glacis', 'Grand Anse Mahe', 'Takamaka', 'Port Glaud', 'Baie Lazare'],
  'Sierra Leone': ['Freetown', 'Bo', 'Kenema', 'Makeni', 'Koidu', 'Lunsar', 'Port Loko', 'Kabala', 'Magburaka', 'Kailahun'],
  'Somalia': ['Mogadishu', 'Hargeisa', 'Burao', 'Bosaso', 'Kismayo', 'Beledweyne', 'Marka', 'Berbera', 'Jowhar', 'Baidoa'],
  'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Nelspruit', 'Kimberley', 'Polokwane', 'Pietermaritzburg', 'Rustenburg', 'Sandton', 'Soweto', 'Benoni'],
  'South Sudan': ['Juba', 'Wau', 'Malakal', 'Yei', 'Bor', 'Aweil', 'Rumbek', 'Bentiu', 'Torit', 'Nimule'],
  'Sudan': ['Khartoum', 'Omdurman', 'Nyala', 'Port Sudan', 'Kassala', 'El Obeid', 'Kosti', 'Wad Madani', 'El Fasher', 'Gedaref'],
  'Tanzania': ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Zanzibar City', 'Kigoma', 'Moshi'],
  'Togo': ['Lomé', 'Sokodé', 'Kara', 'Kpalimé', 'Atakpamé', 'Bassar', 'Tsévié', 'Aného', 'Mango', 'Dapaong'],
  'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous'],
  'Uganda': ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Mbale', 'Kasese', 'Masaka', 'Entebbe', 'Fort Portal'],
  'Zambia': ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira', 'Livingstone', 'Luanshya', 'Kasama', 'Chipata'],
  'Zimbabwe': ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Epworth', 'Kwekwe', 'Kadoma', 'Masvingo', 'Victoria Falls'],

  // Americas
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Resistencia', 'Neuquén', 'Bahía Blanca', 'Corrientes', 'Posadas'],
  'Bahamas': ['Nassau', 'Freeport', 'West End', 'Coopers Town', 'Marsh Harbour', 'Freetown', 'High Rock', 'Andros Town', 'Dunmore Town', 'Spanish Wells'],
  'Barbados': ['Bridgetown', 'Speightstown', 'Oistins', 'Bathsheba', 'Holetown', 'Crane', 'Hastings', 'St. Lawrence Gap', 'Worthing', 'Prospect'],
  'Belize': ['Belize City', 'San Ignacio', 'Orange Walk', 'Belmopan', 'Dangriga', 'Corozal', 'San Pedro', 'Benque Viejo del Carmen', 'Punta Gorda', 'Placencia'],
  'Bolivia': ['La Paz', 'Santa Cruz de la Sierra', 'Cochabamba', 'Sucre', 'Oruro', 'Tarija', 'Potosí', 'Sacaba', 'Montero', 'Trinidad'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre', 'Belém', 'Goiânia', 'Guarulhos', 'Campinas', 'São Luís', 'Florianópolis', 'Natal', 'Vitória', 'João Pessoa', 'Uberlândia'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City', 'Hamilton', 'Victoria', 'Halifax', 'Regina', 'Saskatoon', 'St. John\'s', 'Kelowna', 'Mississauga', 'Surrey', 'Laval', 'Brampton', 'Kitchener'],
  'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica', 'Iquique', 'Puerto Montt', 'Viña del Mar', 'Chillán', 'Osorno', 'Coquimbo'],
  'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Soledad', 'Ibagué', 'Bucaramanga', 'Soacha', 'Santa Marta', 'Villavicencio', 'Pereira', 'Bello', 'Manizales'],
  'Costa Rica': ['San José', 'Limón', 'Alajuela', 'Heredia', 'Cartago', 'Puntarenas', 'Liberia', 'Puerto Viejo', 'Jacó', 'Tamarindo'],
  'Cuba': ['Havana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara', 'Guantánamo', 'Bayamo', 'Las Tunas', 'Cienfuegos', 'Pinar del Río'],
  'Dominican Republic': ['Santo Domingo', 'Santiago de los Caballeros', 'San Pedro de Macorís', 'La Romana', 'San Francisco de Macorís', 'San Cristóbal', 'Puerto Plata', 'Higüey', 'La Vega', 'Punta Cana'],
  'Ecuador': ['Guayaquil', 'Quito', 'Cuenca', 'Santo Domingo', 'Machala', 'Durán', 'Manta', 'Portoviejo', 'Loja', 'Ambato'],
  'El Salvador': ['San Salvador', 'Santa Ana', 'San Miguel', 'Mejicanos', 'Soyapango', 'Santa Tecla', 'Apopa', 'Delgado', 'Ahuachapán', 'Usulután'],
  'Guatemala': ['Guatemala City', 'Mixco', 'Villa Nueva', 'Petapa', 'Quetzaltenango', 'San Miguel Petapa', 'Villa Canales', 'Cobán', 'Escuintla', 'Antigua Guatemala'],
  'Guyana': ['Georgetown', 'Linden', 'New Amsterdam', 'Anna Regina', 'Bartica', 'Skeldon', 'Rosignol', 'Mahaicony Village', 'Mahaica Village', 'Paradise'],
  'Haiti': ['Port-au-Prince', 'Carrefour', 'Delmas', 'Cap-Haïtien', 'Pétionville', 'Port-de-Paix', 'Gonaïves', 'Saint-Marc', 'Les Cayes', 'Jacmel'],
  'Honduras': ['Tegucigalpa', 'San Pedro Sula', 'Choloma', 'La Ceiba', 'El Progreso', 'Choluteca', 'Comayagua', 'Puerto Cortés', 'La Lima', 'Danlí'],
  'Jamaica': ['Kingston', 'Montego Bay', 'Spanish Town', 'Portmore', 'May Pen', 'Mandeville', 'Ocho Rios', 'Negril', 'Savanna-la-Mar', 'Port Antonio'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Zapopan', 'Mérida', 'Cancún', 'Querétaro', 'San Luis Potosí', 'Aguascalientes', 'Hermosillo', 'Chihuahua', 'Morelia', 'Veracruz', 'Acapulco', 'Toluca', 'Culiacán'],
  'Nicaragua': ['Managua', 'León', 'Masaya', 'Matagalpa', 'Chinandega', 'Estelí', 'Granada', 'Ciudad Sandino', 'Tipitapa', 'Jinotega'],
  'Panama': ['Panama City', 'San Miguelito', 'Tocumen', 'David', 'Arraiján', 'Colón', 'La Chorrera', 'Penonomé', 'Santiago', 'Chitré'],
  'Paraguay': ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá', 'Lambaré', 'Fernando de la Mora', 'Limpio', 'Ñemby', 'Encarnación'],
  'Peru': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Cusco', 'Chimbote', 'Huancayo', 'Tacna', 'Pucallpa', 'Callao', 'Ayacucho', 'Cajamarca', 'Puno'],
  'Puerto Rico': ['San Juan', 'Bayamón', 'Carolina', 'Ponce', 'Caguas', 'Guaynabo', 'Mayagüez', 'Arecibo', 'Aguadilla', 'Fajardo'],
  'Suriname': ['Paramaribo', 'Lelydorp', 'Nieuw Nickerie', 'Moengo', 'Nieuw Amsterdam', 'Albina', 'Groningen', 'Brownsweg', 'Totness', 'Brokopondo'],
  'Trinidad and Tobago': ['Port of Spain', 'Chaguanas', 'San Fernando', 'Arima', 'Scarborough', 'Point Fortin', 'Tunapuna', 'Couva', 'Sangre Grande', 'Siparia'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Miami', 'Seattle', 'Denver', 'Boston', 'Atlanta', 'San Francisco', 'Las Vegas', 'Portland', 'Nashville', 'Detroit', 'Washington D.C.', 'Charlotte', 'San Jose', 'Indianapolis', 'Columbus', 'Fort Worth', 'Jacksonville', 'Oklahoma City', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Sacramento', 'Kansas City', 'Cleveland', 'Raleigh', 'Tampa', 'Minneapolis', 'Oakland', 'New Orleans', 'Honolulu', 'Salt Lake City', 'Omaha', 'Pittsburgh'],
  'Uruguay': ['Montevideo', 'Salto', 'Paysandú', 'Las Piedras', 'Rivera', 'Maldonado', 'Tacuarembó', 'Melo', 'Mercedes', 'Artigas'],
  'Venezuela': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'Barcelona', 'Maturín', 'Petare', 'Barinas'],

  // Asia
  'Afghanistan': ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz', 'Ghazni', 'Balkh', 'Baghlan', 'Khost'],
  'Armenia': ['Yerevan', 'Gyumri', 'Vanadzor', 'Vagharshapat', 'Abovyan', 'Kapan', 'Hrazdan', 'Armavir', 'Artashat', 'Ijevan'],
  'Azerbaijan': ['Baku', 'Ganja', 'Sumqayit', 'Mingachevir', 'Lankaran', 'Shirvan', 'Nakhchivan', 'Shaki', 'Yevlakh', 'Barda'],
  'Bahrain': ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'A\'ali', 'Isa Town', 'Sitra', 'Budaiya', 'Jidhafs', 'Al Hidd'],
  'Bangladesh': ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Rangpur', 'Comilla', 'Gazipur', 'Narayanganj', 'Mymensingh', 'Bogra', 'Cox\'s Bazar', 'Jessore', 'Dinajpur', 'Brahmanbaria'],
  'Bhutan': ['Thimphu', 'Phuntsholing', 'Paro', 'Punakha', 'Wangdue Phodrang', 'Trongsa', 'Mongar', 'Trashigang', 'Bumthang', 'Zhemgang'],
  'Brunei': ['Bandar Seri Begawan', 'Kuala Belait', 'Seria', 'Tutong', 'Bangar', 'Muara', 'Temburong', 'Lumut', 'Jerudong', 'Sungai Liang'],
  'Cambodia': ['Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville', 'Kampong Cham', 'Ta Khmau', 'Pursat', 'Kampong Speu', 'Kampot', 'Kratie'],
  'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xi\'an', 'Nanjing', 'Tianjin', 'Chongqing', 'Hong Kong', 'Suzhou', 'Qingdao', 'Dongguan', 'Shenyang', 'Ningbo', 'Harbin', 'Dalian', 'Zhengzhou', 'Jinan', 'Changsha', 'Kunming', 'Fuzhou', 'Xiamen'],
  'Georgia': ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Zugdidi', 'Gori', 'Poti', 'Sukhumi', 'Samtredia', 'Telavi'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Chandigarh', 'Coimbatore', 'Kochi'],
  'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi', 'Denpasar', 'Yogyakarta', 'Malang', 'Balikpapan', 'Batam', 'Manado', 'Pontianak', 'Padang', 'Pekanbaru', 'Banjarmasin'],
  'Iran': ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Tabriz', 'Shiraz', 'Qom', 'Ahvaz', 'Kermanshah', 'Urmia'],
  'Iraq': ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Kirkuk', 'Sulaymaniyah', 'Najaf', 'Karbala', 'Nasiriyah', 'Amarah'],
  'Israel': ['Tel Aviv', 'Jerusalem', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva', 'Holon', 'Bnei Brak', 'Eilat'],
  'Japan': ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Kobe', 'Kyoto', 'Fukuoka', 'Kawasaki', 'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai', 'Niigata', 'Hamamatsu', 'Kumamoto', 'Sagamihara', 'Okayama', 'Shizuoka'],
  'Jordan': ['Amman', 'Zarqa', 'Irbid', 'Russeifa', 'Aqaba', 'Madaba', 'Salt', 'Jerash', 'Ma\'an', 'Karak'],
  'Kazakhstan': ['Almaty', 'Nur-Sultan', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz', 'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau'],
  'Kuwait': ['Kuwait City', 'Al Ahmadi', 'Hawalli', 'Salmiya', 'Al Farwaniyah', 'Fahaheel', 'Al Jahra', 'Mangaf', 'Ar Rumaythiyah', 'Salwa'],
  'Kyrgyzstan': ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Tokmok', 'Uzgen', 'Kara-Balta', 'Naryn', 'Balykchy', 'Talas'],
  'Laos': ['Vientiane', 'Pakse', 'Savannakhet', 'Luang Prabang', 'Thakhek', 'Xam Neua', 'Phonsavan', 'Muang Xay', 'Ban Houayxay', 'Vang Vieng'],
  'Lebanon': ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Jounieh', 'Byblos', 'Baalbek', 'Zahle', 'Nabatieh', 'Batroun'],
  'Malaysia': ['Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Johor Bahru', 'Kota Kinabalu', 'Kuching', 'Malacca', 'Alor Setar', 'Subang Jaya', 'Kota Bharu', 'Kuantan', 'Seremban', 'Sandakan'],
  'Maldives': ['Malé', 'Addu City', 'Fuvahmulah', 'Kulhudhuffushi', 'Thinadhoo', 'Naifaru', 'Ungoofaaru', 'Eydhafushi', 'Muli', 'Dhidhdhoo'],
  'Mongolia': ['Ulaanbaatar', 'Erdenet', 'Darkhan', 'Choibalsan', 'Mörön', 'Nalaikh', 'Bayanhongor', 'Ölgii', 'Khovd', 'Arvaikheer'],
  'Myanmar': ['Yangon', 'Mandalay', 'Naypyidaw', 'Mawlamyine', 'Bago', 'Pathein', 'Monywa', 'Meiktila', 'Myeik', 'Taunggyi'],
  'Nepal': ['Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Birgunj', 'Bharatpur', 'Dharan', 'Janakpur', 'Hetauda', 'Butwal'],
  'North Korea': ['Pyongyang', 'Hamhung', 'Chongjin', 'Nampo', 'Wonsan', 'Sinuiju', 'Tanchon', 'Kaechon', 'Sariwon', 'Haeju'],
  'Oman': ['Muscat', 'Seeb', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Barka', 'Ibri', 'Al Khaburah', 'Rustaq'],
  'Pakistan': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Hyderabad', 'Gujranwala', 'Peshawar', 'Quetta', 'Islamabad', 'Sargodha', 'Sialkot', 'Bahawalpur', 'Sukkur', 'Larkana'],
  'Palestine': ['Gaza', 'Ramallah', 'Hebron', 'Nablus', 'Jenin', 'Tulkarm', 'Bethlehem', 'Jericho', 'Khan Yunis', 'Rafah'],
  'Philippines': ['Manila', 'Quezon City', 'Davao City', 'Caloocan', 'Cebu City', 'Zamboanga City', 'Taguig', 'Antipolo', 'Pasig', 'Cagayan de Oro', 'Makati', 'Baguio', 'Iloilo City', 'Bacolod', 'General Santos'],
  'Qatar': ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor', 'Al Shamal', 'Dukhan', 'Mesaieed', 'Madinat ash Shamal', 'Al Wukair'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Taif', 'Tabuk', 'Buraidah', 'Khobar', 'Abha', 'Khamis Mushait', 'Hofuf', 'Najran', 'Yanbu', 'Al Jubail'],
  'Singapore': ['Singapore', 'Jurong', 'Woodlands', 'Tampines', 'Ang Mo Kio', 'Bedok', 'Bukit Batok', 'Choa Chu Kang', 'Hougang', 'Punggol'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Seongnam', 'Goyang', 'Yongin', 'Bucheon', 'Changwon', 'Cheongju', 'Jeonju', 'Anyang', 'Jeju City'],
  'Sri Lanka': ['Colombo', 'Dehiwala-Mount Lavinia', 'Moratuwa', 'Sri Jayawardenepura Kotte', 'Negombo', 'Kandy', 'Galle', 'Trincomalee', 'Jaffna', 'Batticaloa'],
  'Syria': ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Raqqa', 'Deir ez-Zor', 'Hasaka', 'Qamishli', 'Tartus'],
  'Taiwan': ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Banqiao', 'Hsinchu', 'Taoyuan', 'Keelung', 'Zhongli', 'Chiayi'],
  'Tajikistan': ['Dushanbe', 'Khujand', 'Kulob', 'Qurghonteppa', 'Istaravshan', 'Vahdat', 'Kanibadam', 'Tursunzoda', 'Isfara', 'Panjakent'],
  'Thailand': ['Bangkok', 'Nonthaburi', 'Nakhon Ratchasima', 'Chiang Mai', 'Hat Yai', 'Udon Thani', 'Khon Kaen', 'Pak Kret', 'Pattaya', 'Phuket', 'Chiang Rai', 'Krabi', 'Surat Thani', 'Ayutthaya', 'Kanchanaburi'],
  'Timor-Leste': ['Dili', 'Baucau', 'Maliana', 'Suai', 'Liquiçá', 'Aileu', 'Same', 'Lospalos', 'Ainaro', 'Gleno'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin', 'Diyarbakır', 'Eskişehir', 'Samsun', 'Trabzon', 'Bodrum', 'Cappadocia'],
  'Turkmenistan': ['Ashgabat', 'Türkmenabat', 'Daşoguz', 'Mary', 'Balkanabat', 'Bayramaly', 'Türkmenbaşy', 'Tejen', 'Abadan', 'Atamyrat'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Kalba'],
  'Uzbekistan': ['Tashkent', 'Samarkand', 'Namangan', 'Andijan', 'Bukhara', 'Nukus', 'Qarshi', 'Fergana', 'Kokand', 'Margilan'],
  'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho', 'Bien Hoa', 'Hue', 'Nha Trang', 'Buon Ma Thuot', 'Quy Nhon', 'Da Lat', 'Vung Tau', 'Phan Thiet', 'Hoi An', 'Sa Pa'],
  'Yemen': ['Sana\'a', 'Aden', 'Taiz', 'Al Hudaydah', 'Ibb', 'Mukalla', 'Dhamar', 'Amran', 'Sayyan', 'Zabid'],

  // Europe
  'Albania': ['Tirana', 'Durrës', 'Vlorë', 'Elbasan', 'Shkodër', 'Korçë', 'Fier', 'Berat', 'Lushnjë', 'Kavajë'],
  'Andorra': ['Andorra la Vella', 'Escaldes-Engordany', 'Encamp', 'Sant Julià de Lòria', 'La Massana', 'Santa Coloma', 'Ordino', 'Canillo', 'El Pas de la Casa', 'Arinsal'],
  'Austria': ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn', 'Wiener Neustadt', 'Steyr', 'Feldkirch', 'Bregenz', 'Leonding'],
  'Belarus': ['Minsk', 'Gomel', 'Mogilev', 'Vitebsk', 'Grodno', 'Brest', 'Bobruisk', 'Baranovichi', 'Borisov', 'Pinsk'],
  'Belgium': ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst', 'Mechelen', 'La Louvière', 'Kortrijk', 'Hasselt', 'Ostend'],
  'Bosnia and Herzegovina': ['Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar', 'Bijeljina', 'Prijedor', 'Brčko', 'Doboj', 'Cazin'],
  'Bulgaria': ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen'],
  'Croatia': ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Pula', 'Slavonski Brod', 'Karlovac', 'Varaždin', 'Dubrovnik'],
  'Cyprus': ['Nicosia', 'Limassol', 'Larnaca', 'Famagusta', 'Paphos', 'Kyrenia', 'Protaras', 'Paralimni', 'Aradippou', 'Strovolos'],
  'Czech Republic': ['Prague', 'Brno', 'Ostrava', 'Pilsen', 'Liberec', 'Olomouc', 'České Budějovice', 'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Karlovy Vary'],
  'Denmark': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde', 'Herning', 'Helsingør', 'Silkeborg', 'Næstved', 'Fredericia'],
  'Estonia': ['Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve', 'Viljandi', 'Rakvere', 'Maardu', 'Sillamäe', 'Kuressaare'],
  'Finland': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori', 'Lappeenranta', 'Vaasa', 'Rovaniemi', 'Joensuu', 'Kouvola'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Aix-en-Provence', 'Cannes', 'Avignon', 'Monaco'],
  'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Mannheim', 'Karlsruhe', 'Augsburg', 'Wiesbaden', 'Heidelberg'],
  'Greece': ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Rhodes', 'Ioannina', 'Chania', 'Chalcis', 'Corfu', 'Mykonos', 'Santorini', 'Kalamata', 'Kavala'],
  'Hungary': ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely'],
  'Iceland': ['Reykjavik', 'Kópavogur', 'Hafnarfjörður', 'Akureyri', 'Reykjanesbær', 'Garðabær', 'Mosfellsbær', 'Árborg', 'Akranes', 'Fjarðabyggð'],
  'Ireland': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Swords', 'Dundalk', 'Bray', 'Navan', 'Kilkenny', 'Ennis', 'Carlow', 'Tralee', 'Newbridge'],
  'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Venice', 'Verona', 'Bari', 'Catania', 'Messina', 'Padua', 'Trieste', 'Brescia', 'Parma', 'Modena', 'Reggio Calabria', 'Perugia', 'Siena', 'Pisa', 'Como', 'Amalfi'],
  'Kosovo': ['Pristina', 'Prizren', 'Ferizaj', 'Peja', 'Gjakova', 'Gjilan', 'Podujevo', 'Vushtrri', 'Suhareka', 'Mitrovica'],
  'Latvia': ['Riga', 'Daugavpils', 'Liepāja', 'Jelgava', 'Jūrmala', 'Ventspils', 'Rēzekne', 'Valmiera', 'Jēkabpils', 'Ogre'],
  'Liechtenstein': ['Vaduz', 'Schaan', 'Balzers', 'Triesen', 'Eschen', 'Mauren', 'Triesenberg', 'Ruggell', 'Gamprin', 'Schellenberg'],
  'Lithuania': ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys', 'Alytus', 'Marijampolė', 'Mažeikiai', 'Jonava', 'Utena'],
  'Luxembourg': ['Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck', 'Diekirch', 'Wiltz', 'Echternach', 'Rumelange', 'Grevenmacher'],
  'Malta': ['Valletta', 'Birkirkara', 'Mosta', 'Qormi', 'Żabbar', 'St. Paul\'s Bay', 'Sliema', 'Naxxar', 'Attard', 'Żejtun'],
  'Moldova': ['Chișinău', 'Tiraspol', 'Bălți', 'Bender', 'Rîbnița', 'Cahul', 'Ungheni', 'Soroca', 'Orhei', 'Comrat'],
  'Monaco': ['Monaco', 'Monte Carlo', 'La Condamine', 'Fontvieille', 'Moneghetti', 'Larvotto', 'Saint-Roman', 'La Colle', 'Les Révoires', 'Jardin Exotique'],
  'Montenegro': ['Podgorica', 'Nikšić', 'Herceg Novi', 'Pljevlja', 'Bijelo Polje', 'Cetinje', 'Bar', 'Budva', 'Kotor', 'Ulcinj'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Maastricht', 'Leiden', 'Haarlem', 'Delft', 'Arnhem'],
  'North Macedonia': ['Skopje', 'Bitola', 'Kumanovo', 'Prilep', 'Tetovo', 'Veles', 'Ohrid', 'Gostivar', 'Štip', 'Strumica'],
  'Norway': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg', 'Ålesund', 'Tønsberg', 'Haugesund', 'Moss', 'Bodø'],
  'Poland': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice', 'Białystok', 'Gdynia', 'Częstochowa', 'Radom', 'Toruń'],
  'Portugal': ['Lisbon', 'Porto', 'Amadora', 'Braga', 'Funchal', 'Coimbra', 'Setúbal', 'Almada', 'Agualva-Cacém', 'Queluz', 'Aveiro', 'Évora', 'Faro', 'Sintra', 'Guimarães'],
  'Romania': ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Sibiu', 'Arad', 'Pitești', 'Baia Mare', 'Buzău'],
  'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Samara', 'Chelyabinsk', 'Omsk', 'Rostov-on-Don', 'Ufa', 'Krasnoyarsk', 'Voronezh', 'Perm', 'Volgograd', 'Sochi', 'Vladivostok'],
  'San Marino': ['San Marino', 'Serravalle', 'Borgo Maggiore', 'Domagnano', 'Fiorentino', 'Acquaviva', 'Faetano', 'Chiesanuova', 'Montegiardino', 'Dogana'],
  'Serbia': ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica', 'Zrenjanin', 'Pančevo', 'Čačak', 'Kraljevo', 'Novi Pazar'],
  'Slovakia': ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Banská Bystrica', 'Nitra', 'Trnava', 'Martin', 'Trenčín', 'Poprad'],
  'Slovenia': ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo Mesto', 'Ptuj', 'Nova Gorica', 'Murska Sobota'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Las Palmas', 'Granada', 'Vigo', 'Gijón', 'A Coruña', 'Vitoria-Gasteiz', 'Santander', 'Pamplona', 'San Sebastián', 'Toledo', 'Salamanca', 'Ibiza'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund', 'Umeå', 'Gävle', 'Borås', 'Eskilstuna'],
  'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel/Bienne', 'Thun', 'Köniz', 'La Chaux-de-Fonds', 'Fribourg', 'Neuchâtel', 'Zermatt', 'Interlaken'],
  'Ukraine': ['Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Donetsk', 'Zaporizhzhia', 'Lviv', 'Kryvyi Rih', 'Mykolaiv', 'Mariupol', 'Luhansk', 'Vinnytsia', 'Simferopol', 'Makiivka', 'Sevastopol'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool', 'Leeds', 'Edinburgh', 'Bristol', 'Sheffield', 'Newcastle', 'Nottingham', 'Belfast', 'Leicester', 'Cardiff', 'Southampton', 'Brighton', 'Oxford', 'Cambridge', 'Bath', 'York', 'Aberdeen', 'Inverness'],
  'Vatican City': ['Vatican City'],

  // Oceania
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Hobart', 'Darwin', 'Wollongong', 'Cairns', 'Townsville', 'Geelong', 'Ballarat', 'Bendigo', 'Albury', 'Launceston', 'Mackay', 'Rockhampton'],
  'Fiji': ['Suva', 'Lautoka', 'Nadi', 'Labasa', 'Ba', 'Levuka', 'Savusavu', 'Sigatoka', 'Nausori', 'Rakiraki'],
  'Kiribati': ['Tarawa', 'Betio', 'Bairiki', 'Bikenibeu', 'Tabwakea', 'Ambo', 'Teaoraereke', 'Eita', 'Bonriki', 'Tanaea'],
  'Marshall Islands': ['Majuro', 'Ebeye', 'Arno', 'Jabor', 'Wotje', 'Mili', 'Namdrik', 'Kili', 'Laura', 'Likiep'],
  'Micronesia': ['Palikir', 'Weno', 'Kolonia', 'Tofol', 'Colonia', 'Lelu', 'Nett', 'Madolenihmw', 'Sokehs', 'U'],
  'Nauru': ['Yaren', 'Aiwo', 'Buada', 'Denigomodu', 'Anetan', 'Anabar', 'Boe', 'Ewa', 'Ijuw', 'Meneng'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin', 'Palmerston North', 'Napier-Hastings', 'Nelson', 'Rotorua', 'New Plymouth', 'Whangarei', 'Invercargill', 'Queenstown', 'Gisborne'],
  'Palau': ['Ngerulmud', 'Koror', 'Melekeok', 'Aimeliik', 'Airai', 'Angaur', 'Hatohobei', 'Kayangel', 'Ngarchelong', 'Ngardmau'],
  'Papua New Guinea': ['Port Moresby', 'Lae', 'Arawa', 'Mount Hagen', 'Popondetta', 'Madang', 'Kokopo', 'Mendi', 'Kimbe', 'Goroka'],
  'Samoa': ['Apia', 'Vaitele', 'Faleula', 'Siumu', 'Afega', 'Faleasiu', 'Lotofaga', 'Fasitoo Tai', 'Malie', 'Nofoali\'i'],
  'Solomon Islands': ['Honiara', 'Gizo', 'Auki', 'Buala', 'Kirakira', 'Lata', 'Tulagi', 'Tigoa', 'Taro Island', 'Munda'],
  'Tonga': ['Nukuʻalofa', 'Neiafu', 'Haveluloto', 'Vaini', 'Pangai', 'ʻOhonua', 'Hihifo', 'ʻEua', 'Kolonga', 'Tatakamotonga'],
  'Tuvalu': ['Funafuti', 'Asau', 'Kulia', 'Lolua', 'Niulakita', 'Savave', 'Tanrake', 'Teava', 'Toga', 'Vaiaku'],
  'Vanuatu': ['Port Vila', 'Luganville', 'Norsup', 'Isangel', 'Sola', 'Lakatoro', 'Longana', 'Saratamata', 'Lenakel', 'Port Olry'],

  // Catch-all
  'Other': ['Remote / Worldwide'],
};

const COUNTRIES = Object.keys(COUNTRIES_WITH_CITIES).sort();

export default function CountryCitySelect({ country, city, onCountryChange, onCityChange }: CountryCitySelectProps) {
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRIES;
    return COUNTRIES.filter(c => 
      c.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  const cities = useMemo(() => {
    if (!country) return [];
    return COUNTRIES_WITH_CITIES[country] || [];
  }, [country]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    return cities.filter(c => 
      c.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [cities, citySearch]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Country Select */}
      <div className="space-y-2">
        <Label>Country *</Label>
        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between font-normal"
            >
              {country || 'Select country...'}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="p-2">
              <Input
                placeholder="Search countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="h-9"
              />
            </div>
            <ScrollArea className="h-60">
              <div className="p-1">
                {filteredCountries.map((c) => (
                  <div
                    key={c}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm text-sm hover:bg-accent',
                      country === c && 'bg-accent'
                    )}
                    onClick={() => {
                      onCountryChange(c);
                      setCountryOpen(false);
                      setCountrySearch('');
                    }}
                  >
                    {country === c && <Check className="h-4 w-4" />}
                    <span className={cn(country !== c && 'ml-6')}>{c}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* City Select */}
      <div className="space-y-2">
        <Label>City *</Label>
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between font-normal"
              disabled={!country}
            >
              {city || 'Select city...'}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="p-2">
              <Input
                placeholder="Search cities..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="h-9"
              />
            </div>
            <ScrollArea className="h-60">
              <div className="p-1">
                {filteredCities.map((c) => (
                  <div
                    key={c}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm text-sm hover:bg-accent',
                      city === c && 'bg-accent'
                    )}
                    onClick={() => {
                      onCityChange(c);
                      setCityOpen(false);
                      setCitySearch('');
                    }}
                  >
                    {city === c && <Check className="h-4 w-4" />}
                    <span className={cn(city !== c && 'ml-6')}>{c}</span>
                  </div>
                ))}
                {filteredCities.length === 0 && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No cities found
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}