/**
 * Startbestand an Zutaten mit ihrer Supermarkt-Abteilung.
 *
 * Zweck: ein neuer Haushalt fängt nicht bei „alles Sonstiges" an. Unbekannte
 * Zutaten landen in „Sonstiges" und werden einmal von Hand zugeordnet — das
 * bleibt dann für immer. Diese Liste soll den Großteil dessen abdecken, was in
 * deutschen Alltagsrezepten vorkommt, nicht vollständig sein.
 *
 * Reihenfolge der Abteilungen folgt einem üblichen Supermarkt-Rundgang.
 */
export const CATEGORIES = [
  { id: "obst-gemuese", name: "Obst & Gemüse", sortOrder: 10 },
  { id: "backwaren", name: "Brot & Backwaren", sortOrder: 20 },
  { id: "fleisch-fisch", name: "Fleisch & Fisch", sortOrder: 30 },
  { id: "kuehlregal", name: "Kühlregal", sortOrder: 40 },
  { id: "tiefkuehl", name: "Tiefkühl", sortOrder: 50 },
  { id: "konserven", name: "Konserven & Gläser", sortOrder: 60 },
  { id: "trockenware", name: "Nudeln, Reis & Trockenware", sortOrder: 70 },
  { id: "backen", name: "Backen & Süßes", sortOrder: 80 },
  { id: "gewuerze", name: "Gewürze, Öle & Saucen", sortOrder: 90 },
  { id: "getraenke", name: "Getränke", sortOrder: 100 },
  { id: "haushalt", name: "Haushalt", sortOrder: 110 },
  { id: "sonstiges", name: "Sonstiges", sortOrder: 999 },
];

export const INGREDIENTS = {
  "obst-gemuese": [
    "Zwiebel", "Rote Zwiebel", "Schalotte", "Frühlingszwiebel", "Knoblauch",
    "Karotte", "Möhre", "Kartoffel", "Süßkartoffel", "Tomate", "Cherrytomate",
    "Paprika", "Zucchini", "Aubergine", "Gurke", "Lauch", "Staudensellerie",
    "Knollensellerie", "Kohlrabi", "Weißkohl", "Rotkohl", "Spitzkohl",
    "Blumenkohl", "Brokkoli", "Rosenkohl", "Wirsing", "Spinat", "Mangold",
    "Feldsalat", "Kopfsalat", "Rucola", "Eisbergsalat", "Romanasalat",
    "Champignons", "Pilze", "Pfifferlinge", "Kürbis", "Pastinake", "Rote Bete",
    "Radieschen", "Rettich", "Fenchel", "Spargel", "Grüne Bohnen",
    "Zuckerschoten", "Ingwer", "Chilischote", "Petersilie", "Basilikum",
    "Schnittlauch", "Dill", "Koriander", "Minze", "Rosmarin", "Thymian",
    "Salbei", "Zitrone", "Limette", "Orange", "Apfel", "Banane", "Birne",
    "Erdbeeren", "Himbeeren", "Blaubeeren", "Weintrauben", "Pfirsich",
    "Nektarine", "Pflaume", "Kirschen", "Mango", "Ananas", "Avocado",
    "Wassermelone", "Kiwi", "Datteln", "Feige", "Granatapfel",
  ],
  backwaren: [
    "Brot", "Vollkornbrot", "Toastbrot", "Baguette", "Brötchen", "Fladenbrot",
    "Tortillas", "Wraps", "Knäckebrot", "Zwieback", "Croissant", "Burgerbrötchen",
  ],
  "fleisch-fisch": [
    "Rindergulasch", "Rinderhackfleisch", "Gemischtes Hackfleisch", "Rinderfilet",
    "Rumpsteak", "Rinderbraten", "Schweinefilet", "Schweineschnitzel",
    "Schweinebauch", "Kasseler", "Hähnchenbrust", "Hähnchenschenkel",
    "Hähnchenkeule", "Ganzes Hähnchen", "Putenbrust", "Entenbrust", "Lammkeule",
    "Lammkotelett", "Speck", "Speckwürfel", "Bacon", "Schinken", "Kochschinken",
    "Serranoschinken", "Salami", "Bratwurst", "Chorizo", "Leberwurst",
    "Lachsfilet", "Kabeljau", "Seelachs", "Forelle", "Garnelen", "Muscheln",
    "Tintenfisch", "Räucherlachs",
  ],
  kuehlregal: [
    "Milch", "Vollmilch", "H-Milch", "Buttermilch", "Kefir", "Sahne",
    "Schlagsahne", "Crème fraîche", "Schmand", "Saure Sahne", "Joghurt",
    "Naturjoghurt", "Griechischer Joghurt", "Skyr", "Quark", "Magerquark",
    "Frischkäse", "Butter", "Margarine", "Butterschmalz", "Eier", "Gouda",
    "Emmentaler", "Bergkäse", "Mozzarella", "Feta", "Parmesan", "Pecorino",
    "Ricotta", "Mascarpone", "Gorgonzola", "Camembert", "Brie", "Halloumi",
    "Reibekäse", "Frische Hefe", "Tofu", "Räuchertofu", "Blätterteig",
    "Pizzateig", "Hafermilch", "Sojamilch", "Mandelmilch", "Hummus",
  ],
  tiefkuehl: [
    "TK-Erbsen", "TK-Spinat", "TK-Blattspinat", "TK-Beeren", "TK-Himbeeren",
    "TK-Gemüse", "Pommes frites", "Fischstäbchen", "Vanilleeis", "Blätterteig (TK)",
  ],
  konserven: [
    "Tomatenmark", "Passierte Tomaten", "Gehackte Tomaten", "Dosentomaten",
    "Kokosmilch", "Kidneybohnen", "Kichererbsen (Dose)", "Weiße Bohnen",
    "Mais", "Oliven", "Kapern", "Gewürzgurken", "Sauerkraut", "Rotkohl (Glas)",
    "Thunfisch (Dose)", "Sardellen", "Erdnussbutter", "Marmelade", "Honig",
    "Apfelmus", "Pesto", "Ajvar", "Gemüsebrühe", "Rinderbrühe", "Hühnerbrühe",
    "Brühe", "Fond", "Tomatensauce", "Sardinen",
  ],
  trockenware: [
    "Nudeln", "Spaghetti", "Penne", "Fusilli", "Tagliatelle", "Lasagneplatten",
    "Spätzle", "Reis", "Basmatireis", "Risottoreis", "Milchreis", "Couscous",
    "Bulgur", "Quinoa", "Polenta", "Haferflocken", "Müsli", "Cornflakes",
    "Linsen", "Rote Linsen", "Belugalinsen", "Semmelbrösel", "Paniermehl",
    "Mehl", "Weizenmehl", "Dinkelmehl", "Vollkornmehl", "Grieß", "Speisestärke",
    "Kartoffelstärke", "Saucenbinder", "Walnüsse", "Haselnüsse", "Mandeln",
    "Gemahlene Mandeln", "Cashewkerne", "Pinienkerne", "Sonnenblumenkerne",
    "Kürbiskerne", "Sesam", "Leinsamen", "Chiasamen", "Rosinen", "Trockenhefe",
    "Backpulver", "Natron", "Kokosraspeln", "Getrocknete Tomaten",
  ],
  backen: [
    "Zucker", "Puderzucker", "Brauner Zucker", "Vanillezucker", "Vanilleschote",
    "Vanilleextrakt", "Zartbitterschokolade", "Vollmilchschokolade", "Kuvertüre",
    "Schokoladenraspel", "Kakaopulver", "Marzipan", "Gelatine", "Agar-Agar",
    "Ahornsirup", "Agavendicksaft", "Zuckerrübensirup", "Rohrzucker",
  ],
  gewuerze: [
    "Salz", "Meersalz", "Pfeffer", "Paprikapulver", "Currypulver", "Kurkuma",
    "Kreuzkümmel", "Kümmel", "Koriandersamen", "Muskatnuss", "Zimt", "Nelken",
    "Kardamom", "Lorbeerblatt", "Wacholderbeeren", "Senfkörner", "Chiliflocken",
    "Cayennepfeffer", "Getrockneter Oregano", "Getrockneter Thymian",
    "Getrockneter Rosmarin", "Majoran", "Italienische Kräuter",
    "Kräuter der Provence", "Currypaste", "Olivenöl", "Rapsöl",
    "Sonnenblumenöl", "Sesamöl", "Kokosöl", "Essig", "Balsamico",
    "Weißweinessig", "Apfelessig", "Senf", "Dijonsenf", "Ketchup", "Mayonnaise",
    "Sojasauce", "Fischsauce", "Worcestershiresauce", "Tabasco", "Sriracha",
    "Harissa", "Tahini", "Zitronensaft", "Gemahlener Kreuzkümmel",
  ],
  getraenke: [
    "Mineralwasser", "Rotwein", "Weißwein", "Sekt", "Bier", "Apfelsaft",
    "Orangensaft", "Tomatensaft", "Kaffee", "Espresso", "Tee", "Cola",
    "Tonic Water", "Wodka", "Rum", "Weinbrand", "Portwein", "Sherry", "Mirin",
  ],
  haushalt: [
    "Backpapier", "Alufolie", "Frischhaltefolie", "Küchenrolle", "Gefrierbeutel",
    "Zahnstocher", "Küchengarn", "Müllbeutel", "Spülmittel",
  ],
};
