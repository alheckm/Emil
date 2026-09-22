/**
 * Englische Bildmotive zu jeder Zutat aus ingredient-seed-data.mjs.
 *
 * Warum eine eigene Liste: das Bildmodell versteht nur Englisch, und
 * "Paprika" ist im Deutschen die Schote UND das Pulver. Die Motive stehen
 * deshalb ausgeschrieben da, statt aus dem Namen geraten zu werden.
 *
 * Pulver, Öle und Saucen brauchen ein Gefäß, sonst rendert das Modell einen
 * Haufen Staub im Nichts. Das Gefäß ist absichtlich immer dasselbe weiße
 * Schälchen bzw. Glas — sonst wird die Reihe unruhig.
 */
import { readFileSync } from "node:fs";

const BOWL = (what) => `a small plain white ceramic bowl filled with ${what}`;
const JAR = (what) => `a small clear glass jar of ${what}`;
const GLASS = (what) => `a plain clear drinking glass of ${what}`;

/** Sieben feste Pastelltöne — Werte + Prompt-Text stehen in palette.json,
 * damit process.py (Python) dieselben Hex-Werte liest wie hier. */
export const PALETTE = JSON.parse(
  readFileSync(new URL("./palette.json", import.meta.url), "utf8"),
);

export const SUBJECTS = {
  // ── Obst & Gemüse ────────────────────────────────────────────────────────
  "Zwiebel": "a whole yellow onion", "Rote Zwiebel": "a whole red onion",
  "Schalotte": "two brown shallots", "Frühlingszwiebel": "a bunch of spring onions",
  "Knoblauch": "a whole garlic bulb", "Knoblauchzehe": "a single garlic clove",
  "Karotte": "a fresh carrot with green top",
  "Möhre": "two fresh carrots", "Kartoffel": "a raw potato", "Süßkartoffel": "a raw sweet potato",
  "Tomate": "a ripe red tomato with green stem", "Cherrytomate": "a small cluster of cherry tomatoes",
  "Paprika": "a red bell pepper", "Zucchini": "a fresh green zucchini",
  "Aubergine": "a glossy purple eggplant", "Gurke": "a fresh cucumber",
  "Lauch": "a trimmed leek", "Staudensellerie": "a bunch of celery stalks",
  "Knollensellerie": "a celeriac root", "Kohlrabi": "a green kohlrabi with leaves",
  "Weißkohl": "a head of white cabbage", "Rotkohl": "a head of red cabbage",
  "Spitzkohl": "a pointed sweetheart cabbage", "Blumenkohl": "a head of cauliflower",
  "Brokkoli": "a head of broccoli", "Rosenkohl": "a small pile of brussels sprouts",
  "Wirsing": "a head of savoy cabbage", "Spinat": "a bunch of fresh spinach leaves",
  "Mangold": "a bunch of swiss chard", "Feldsalat": "a small pile of lamb's lettuce",
  "Kopfsalat": "a head of butterhead lettuce", "Rucola": "a small pile of arugula leaves",
  "Eisbergsalat": "a head of iceberg lettuce", "Romanasalat": "a head of romaine lettuce",
  "Champignons": "three white button mushrooms", "Pilze": "a small pile of mixed mushrooms",
  "Pfifferlinge": "a small pile of chanterelle mushrooms", "Kürbis": "a whole orange hokkaido pumpkin",
  "Pastinake": "a parsnip", "Rote Bete": "a raw beetroot", "Radieschen": "a small bunch of red radishes",
  "Rettich": "a white daikon radish", "Fenchel": "a fennel bulb", "Spargel": "a bundle of white asparagus spears",
  "Grüne Bohnen": "a small bundle of green beans", "Zuckerschoten": "a small pile of sugar snap peas",
  "Ingwer": "a piece of fresh ginger root", "Chilischote": "two red chili peppers",
  "Petersilie": "a bunch of flat-leaf parsley", "Basilikum": "a bunch of fresh basil",
  "Schnittlauch": "a bundle of chives", "Dill": "a bunch of fresh dill",
  "Koriander": "a bunch of fresh cilantro", "Minze": "a bunch of fresh mint",
  "Rosmarin": "two sprigs of rosemary", "Thymian": "a few sprigs of thyme",
  "Salbei": "a few fresh sage leaves", "Zitrone": "a whole lemon", "Limette": "a whole lime",
  "Orange": "a whole orange", "Apfel": "a red apple", "Banane": "a ripe banana",
  "Birne": "a green pear", "Erdbeeren": "a few fresh strawberries", "Himbeeren": "a small pile of raspberries",
  "Blaubeeren": "a small pile of blueberries", "Weintrauben": "a bunch of green grapes",
  "Pfirsich": "a ripe peach", "Nektarine": "a ripe nectarine", "Pflaume": "two purple plums",
  "Kirschen": "a few fresh cherries with stems", "Mango": "a ripe mango", "Ananas": "a whole pineapple",
  "Avocado": "a whole avocado", "Wassermelone": "a wedge of watermelon", "Kiwi": "a whole kiwi fruit",
  "Datteln": "a few medjool dates", "Feige": "two fresh figs", "Granatapfel": "a whole pomegranate",

  // ── Brot & Backwaren ─────────────────────────────────────────────────────
  "Brot": "a rustic loaf of bread", "Vollkornbrot": "a loaf of dark wholegrain bread",
  "Toastbrot": "a few slices of white toast bread", "Baguette": "a french baguette",
  "Brötchen": "two crusty bread rolls", "Fladenbrot": "a round flatbread",
  "Tortillas": "a stack of flour tortillas", "Wraps": "a rolled tortilla wrap",
  "Knäckebrot": "two slices of crispbread", "Zwieback": "two pieces of rusk bread",
  "Croissant": "a golden croissant", "Burgerbrötchen": "a sesame burger bun",

  // ── Fleisch & Fisch ──────────────────────────────────────────────────────
  "Rindergulasch": "raw diced beef for stew", "Rinderhackfleisch": "raw ground beef",
  "Gemischtes Hackfleisch": "raw mixed ground meat", "Rinderfilet": "a raw beef tenderloin",
  "Rumpsteak": "a raw rump steak", "Rinderbraten": "a raw beef roast",
  "Schweinefilet": "a raw pork tenderloin", "Schweineschnitzel": "a raw pork cutlet",
  "Schweinebauch": "a piece of raw pork belly", "Kasseler": "a smoked pork loin",
  "Hähnchenbrust": "two raw chicken breasts", "Hähnchenschenkel": "two raw chicken thighs",
  "Hähnchenkeule": "two raw chicken drumsticks", "Ganzes Hähnchen": "a whole raw chicken",
  "Putenbrust": "a raw turkey breast", "Entenbrust": "a raw duck breast",
  "Lammkeule": "a raw leg of lamb", "Lammkotelett": "two raw lamb chops",
  "Speck": "a slab of bacon", "Speckwürfel": BOWL("diced bacon cubes"), "Bacon": "a few strips of raw bacon",
  "Schinken": "a few slices of cured ham", "Kochschinken": "a few slices of cooked ham",
  "Serranoschinken": "a few slices of serrano ham", "Salami": "a few slices of salami",
  "Bratwurst": "two raw bratwurst sausages", "Chorizo": "a chorizo sausage",
  "Leberwurst": "a slice of liver sausage", "Lachsfilet": "a raw salmon fillet",
  "Kabeljau": "a raw cod fillet", "Seelachs": "a raw pollock fillet", "Forelle": "a whole fresh trout",
  "Garnelen": "a few raw peeled prawns", "Muscheln": "a small pile of blue mussels",
  "Tintenfisch": "a fresh squid", "Räucherlachs": "a few slices of smoked salmon",

  // ── Kühlregal ────────────────────────────────────────────────────────────
  "Milch": GLASS("milk"), "Vollmilch": GLASS("whole milk"), "H-Milch": GLASS("milk"),
  "Buttermilch": GLASS("buttermilk"), "Kefir": GLASS("kefir"), "Sahne": GLASS("cream"),
  "Schlagsahne": BOWL("whipped cream"), "Crème fraîche": BOWL("creme fraiche"),
  "Schmand": BOWL("sour cream"), "Saure Sahne": BOWL("sour cream"), "Joghurt": BOWL("plain yogurt"),
  "Naturjoghurt": BOWL("plain natural yogurt"), "Griechischer Joghurt": BOWL("thick greek yogurt"),
  "Skyr": BOWL("skyr"), "Quark": BOWL("quark cheese"), "Magerquark": BOWL("low fat quark"),
  "Frischkäse": BOWL("cream cheese"), "Butter": "a block of butter", "Margarine": BOWL("margarine"),
  "Butterschmalz": JAR("clarified butter"), "Schweineschmalz": JAR("white pork lard"),
  "Eier": "three brown chicken eggs",
  "Gouda": "a wedge of gouda cheese", "Emmentaler": "a wedge of emmental cheese",
  "Bergkäse": "a wedge of alpine cheese", "Mozzarella": "a ball of fresh mozzarella",
  "Feta": "a block of feta cheese", "Parmesan": "a wedge of parmesan cheese",
  "Pecorino": "a wedge of pecorino cheese", "Ricotta": BOWL("ricotta cheese"),
  "Mascarpone": BOWL("mascarpone"), "Gorgonzola": "a wedge of gorgonzola cheese",
  "Camembert": "a round camembert cheese", "Brie": "a wedge of brie cheese",
  "Halloumi": "a block of halloumi cheese", "Reibekäse": BOWL("grated cheese"),
  "Frische Hefe": "a cube of fresh yeast", "Tofu": "a block of firm tofu",
  "Räuchertofu": "a block of smoked tofu", "Blätterteig": "a roll of puff pastry",
  "Pizzateig": "a ball of pizza dough", "Hafermilch": GLASS("oat milk"),
  "Sojamilch": GLASS("soy milk"), "Mandelmilch": GLASS("almond milk"), "Hummus": BOWL("hummus"),

  // ── Tiefkühl ─────────────────────────────────────────────────────────────
  "TK-Erbsen": BOWL("frozen green peas"), "TK-Spinat": BOWL("frozen spinach"),
  "TK-Blattspinat": BOWL("frozen leaf spinach"), "TK-Beeren": BOWL("frozen mixed berries"),
  "TK-Himbeeren": BOWL("frozen raspberries"), "TK-Gemüse": BOWL("frozen mixed vegetables"),
  "Pommes frites": BOWL("frozen french fries"), "Fischstäbchen": "three frozen fish fingers",
  "Vanilleeis": BOWL("vanilla ice cream"), "Blätterteig (TK)": "a roll of frozen puff pastry",

  // ── Konserven & Gläser ───────────────────────────────────────────────────
  "Tomatenmark": JAR("tomato paste"), "Passierte Tomaten": JAR("tomato passata"),
  "Gehackte Tomaten": "an open tin of chopped tomatoes", "Dosentomaten": "an open tin of peeled tomatoes",
  "Kokosmilch": "an open tin of coconut milk", "Kidneybohnen": BOWL("red kidney beans"),
  "Kichererbsen (Dose)": BOWL("cooked chickpeas"), "Weiße Bohnen": BOWL("white cannellini beans"),
  "Mais": BOWL("sweetcorn kernels"), "Oliven": BOWL("green olives"), "Kapern": JAR("capers"),
  "Gewürzgurken": JAR("pickled gherkins"), "Sauerkraut": BOWL("sauerkraut"),
  "Rotkohl (Glas)": JAR("pickled red cabbage"), "Thunfisch (Dose)": "an open tin of tuna",
  "Sardellen": JAR("anchovy fillets"), "Erdnussbutter": JAR("peanut butter"),
  "Marmelade": JAR("strawberry jam"), "Honig": JAR("golden honey"), "Apfelmus": BOWL("apple sauce"),
  "Pesto": JAR("green basil pesto"), "Ajvar": JAR("red ajvar paste"),
  "Gemüsebrühe": BOWL("vegetable broth"), "Rinderbrühe": BOWL("beef broth"),
  "Hühnerbrühe": BOWL("chicken broth"), "Brühe": BOWL("clear broth"), "Fond": JAR("dark stock"),
  "Kalbsfond": JAR("veal stock"),
  "Tomatensauce": JAR("tomato sauce"), "Sardinen": "an open tin of sardines",

  // ── Nudeln, Reis & Trockenware ───────────────────────────────────────────
  "Nudeln": BOWL("dried pasta"), "Spaghetti": "a bundle of dried spaghetti",
  "Penne": BOWL("dried penne pasta"), "Fusilli": BOWL("dried fusilli pasta"),
  "Tagliatelle": "a nest of dried tagliatelle", "Lasagneplatten": "a stack of dried lasagne sheets",
  "Spätzle": BOWL("fresh spaetzle noodles"), "Reis": BOWL("white rice grains"),
  "Basmatireis": BOWL("basmati rice grains"), "Risottoreis": BOWL("arborio rice grains"),
  "Milchreis": BOWL("pudding rice"), "Couscous": BOWL("dry couscous"), "Bulgur": BOWL("dry bulgur wheat"),
  "Quinoa": BOWL("dry quinoa"), "Polenta": BOWL("dry polenta cornmeal"), "Haferflocken": BOWL("rolled oats"),
  "Müsli": BOWL("muesli"), "Cornflakes": BOWL("cornflakes"), "Linsen": BOWL("brown lentils"),
  "Rote Linsen": BOWL("red lentils"), "Belugalinsen": BOWL("black beluga lentils"),
  "Berglinsen": BOWL("brown-green mountain lentils"),
  "Semmelbrösel": BOWL("breadcrumbs"), "Paniermehl": BOWL("fine breadcrumbs"),
  "Mehl": BOWL("white wheat flour"), "Weizenmehl": BOWL("wheat flour"),
  "Dinkelmehl": BOWL("spelt flour"), "Vollkornmehl": BOWL("wholegrain flour"),
  "Grieß": BOWL("semolina"), "Speisestärke": BOWL("cornstarch"), "Kartoffelstärke": BOWL("potato starch"),
  "Saucenbinder": BOWL("sauce thickener powder"), "Walnüsse": BOWL("shelled walnuts"),
  "Haselnüsse": BOWL("hazelnuts"), "Mandeln": BOWL("whole almonds"),
  "Gemahlene Mandeln": BOWL("ground almonds"), "Cashewkerne": BOWL("cashew nuts"),
  "Pinienkerne": BOWL("pine nuts"), "Sonnenblumenkerne": BOWL("sunflower seeds"),
  "Kürbiskerne": BOWL("pumpkin seeds"), "Sesam": BOWL("sesame seeds"),
  "Leinsamen": BOWL("flax seeds"), "Chiasamen": BOWL("chia seeds"), "Rosinen": BOWL("raisins"),
  "Trockenhefe": BOWL("dry yeast granules"), "Backpulver": BOWL("baking powder"),
  "Natron": BOWL("baking soda"), "Kokosraspeln": BOWL("desiccated coconut"),
  "Getrocknete Tomaten": BOWL("sun dried tomatoes"), "getrocknete Aprikosen": BOWL("dried apricots"),

  // ── Backen & Süßes ───────────────────────────────────────────────────────
  "Zucker": BOWL("white sugar"), "Puderzucker": BOWL("powdered sugar"),
  "Brauner Zucker": BOWL("brown sugar"), "Vanillezucker": BOWL("vanilla sugar"),
  "Vanilleschote": "two vanilla pods", "Vanilleextrakt": JAR("vanilla extract"),
  "Zartbitterschokolade": "a bar of dark chocolate", "Vollmilchschokolade": "a bar of milk chocolate",
  "Kuvertüre": BOWL("chocolate couverture pieces"), "Schokoladenraspel": BOWL("chocolate shavings"),
  "Kakaopulver": BOWL("cocoa powder"), "Marzipan": "a block of marzipan",
  "Gelatine": "a few sheets of gelatine", "Agar-Agar": BOWL("agar agar powder"),
  "Ahornsirup": JAR("maple syrup"), "Agavendicksaft": JAR("agave syrup"),
  "Zuckerrübensirup": JAR("dark beet syrup"), "Rohrzucker": BOWL("raw cane sugar"),

  // ── Gewürze, Öle & Saucen ────────────────────────────────────────────────
  "Salz": BOWL("coarse salt"), "Meersalz": BOWL("flaky sea salt"),
  "Pfeffer": BOWL("black peppercorns"), "schwarzer Pfeffer": BOWL("black peppercorns"),
  "Paprikapulver": BOWL("red paprika powder"),
  "Currypulver": BOWL("yellow curry powder"), "scharfes Currypulver": BOWL("hot red curry powder"),
  "Kurkuma": BOWL("golden turmeric powder"),
  "Kreuzkümmel": BOWL("cumin seeds"), "Kümmel": BOWL("caraway seeds"),
  "Koriandersamen": BOWL("coriander seeds"), "Muskatnuss": "two whole nutmegs",
  "Zimt": "a few cinnamon sticks", "Nelken": BOWL("whole cloves"), "Gewürznelke": BOWL("whole cloves"),
  "Kardamom": BOWL("green cardamom pods"), "Lorbeerblatt": "a few dried bay leaves",
  "Lorbeerblätter": "a few dried bay leaves",
  "Wacholderbeeren": BOWL("juniper berries"), "Wacholderbeere": BOWL("juniper berries"),
  "Senfkörner": BOWL("yellow mustard seeds"),
  "Chiliflocken": BOWL("red chili flakes"), "Cayennepfeffer": BOWL("cayenne pepper powder"),
  "Getrockneter Oregano": BOWL("dried oregano"), "Getrockneter Thymian": BOWL("dried thyme"),
  "Getrockneter Rosmarin": BOWL("dried rosemary"), "Majoran": BOWL("dried marjoram"),
  "Italienische Kräuter": BOWL("dried italian herb mix"), "Kräuter der Provence": BOWL("herbes de provence"),
  "Currypaste": JAR("red curry paste"), "Olivenöl": JAR("green olive oil"),
  "Rapsöl": JAR("rapeseed oil"), "Sonnenblumenöl": JAR("sunflower oil"),
  "Sesamöl": JAR("sesame oil"), "Kokosöl": JAR("solid coconut oil"), "Essig": JAR("clear vinegar"),
  "Bratöl": JAR("neutral cooking oil"),
  "Balsamico": JAR("dark balsamic vinegar"), "Weißweinessig": JAR("white wine vinegar"),
  "Apfelessig": JAR("apple cider vinegar"), "Senf": JAR("yellow mustard"),
  "Dijonsenf": JAR("dijon mustard"), "Ketchup": JAR("tomato ketchup"),
  "Mayonnaise": JAR("mayonnaise"), "Sojasauce": JAR("dark soy sauce"),
  "Fischsauce": JAR("fish sauce"), "Worcestershiresauce": JAR("worcestershire sauce"),
  "Tabasco": JAR("hot red pepper sauce"), "Sriracha": JAR("sriracha chili sauce"),
  "Harissa": JAR("red harissa paste"), "Tahini": JAR("sesame tahini paste"),
  "Zitronensaft": GLASS("lemon juice"), "Gemahlener Kreuzkümmel": BOWL("ground cumin"),

  // ── Getränke ─────────────────────────────────────────────────────────────
  "Mineralwasser": GLASS("sparkling water"), "Wasser": GLASS("still water"),
  "Rotwein": "a glass of red wine",
  "Weißwein": "a glass of white wine", "Sekt": "a flute of sparkling wine",
  "Bier": "a glass of golden beer", "Apfelsaft": GLASS("apple juice"),
  "Orangensaft": GLASS("orange juice"), "Tomatensaft": GLASS("tomato juice"),
  "Kaffee": "a cup of black coffee", "Espresso": "a small cup of espresso",
  "Tee": "a cup of black tea", "Cola": GLASS("cola"), "Tonic Water": GLASS("tonic water"),
  "Wodka": "a shot glass of vodka", "Rum": "a glass of dark rum",
  "Weinbrand": "a glass of brandy", "Portwein": "a glass of port wine",
  "Sherry": "a glass of sherry", "Mirin": JAR("mirin rice wine"),

  // ── Haushalt ─────────────────────────────────────────────────────────────
  "Backpapier": "a roll of baking parchment paper", "Alufolie": "a roll of aluminium foil",
  "Frischhaltefolie": "a roll of cling film", "Küchenrolle": "a roll of kitchen paper towels",
  "Gefrierbeutel": "a stack of clear freezer bags", "Zahnstocher": "a small pile of wooden toothpicks",
  "Küchengarn": "a ball of kitchen twine", "Müllbeutel": "a roll of black bin bags",
  "Spülmittel": "a bottle of dish soap",
};

/**
 * Feste Pastell-Kategorie pro Zutat — dieselbe Kategorie ergibt denselben
 * Hintergrund, damit z. B. Tomate und Erdbeeren (beide rot) optisch
 * zusammengehören, statt dass das Modell pro Bild neu rät. Fehlt eine Zutat
 * hier (z. B. beim Rezept-Import frisch entstanden), greift der Default
 * "yellow" in colorFor().
 *
 * Es gibt keine neutrale achte Kategorie "beige" mehr (gestrichen, weil sie
 * als Sammelbecken fuer alles Unentschiedene taugte, aber selbst nie eine
 * saubere Pastellfarbe ergab). Jede vormals "beige" markierte Zutat wurde
 * einzeln nach "yellow" (blass, cremig — Milchprodukte, helles Mehl, Reis,
 * Gefluegel, Zucker, Salz …) oder "orange" (warm, braeunlich — Kruste,
 * Gewuerze, Nuesse, Kaffee, Schokolade …) einsortiert. Der Default-Fallback
 * fuer unbekannte Zutaten ist "yellow", aus demselben Grund wie vorher
 * "beige": am wenigsten wahrscheinlich, klar falsch zu wirken.
 */
export const COLORS = {
  // ── Obst & Gemüse ────────────────────────────────────────────────────────
  "Zwiebel": "yellow", "Rote Zwiebel": "red", "Schalotte": "orange",
  "Frühlingszwiebel": "green", "Knoblauch": "yellow", "Knoblauchzehe": "yellow",
  "Karotte": "orange", "Möhre": "orange", "Kartoffel": "orange", "Süßkartoffel": "orange",
  "Tomate": "red", "Cherrytomate": "red", "Paprika": "red", "Zucchini": "green",
  "Aubergine": "purple", "Gurke": "green", "Lauch": "green", "Staudensellerie": "green",
  "Knollensellerie": "orange", "Kohlrabi": "green", "Weißkohl": "green", "Rotkohl": "purple",
  "Spitzkohl": "green", "Blumenkohl": "yellow", "Brokkoli": "green", "Rosenkohl": "green",
  "Wirsing": "green", "Spinat": "green", "Mangold": "green", "Feldsalat": "green",
  "Kopfsalat": "green", "Rucola": "green", "Eisbergsalat": "green", "Romanasalat": "green",
  "Champignons": "yellow", "Pilze": "orange", "Pfifferlinge": "orange", "Kürbis": "orange",
  "Pastinake": "yellow", "Rote Bete": "purple", "Radieschen": "red", "Rettich": "yellow",
  "Fenchel": "green", "Spargel": "yellow", "Grüne Bohnen": "green", "Zuckerschoten": "green",
  "Ingwer": "orange", "Chilischote": "red", "Petersilie": "green", "Basilikum": "green",
  "Schnittlauch": "green", "Dill": "green", "Koriander": "green", "Minze": "green",
  "Rosmarin": "green", "Thymian": "green", "Salbei": "green", "Zitrone": "yellow",
  "Limette": "green", "Orange": "orange", "Apfel": "red", "Banane": "yellow",
  "Birne": "green", "Erdbeeren": "red", "Himbeeren": "red", "Blaubeeren": "blue",
  "Weintrauben": "green", "Pfirsich": "orange", "Nektarine": "orange", "Pflaume": "purple",
  "Kirschen": "red", "Mango": "orange", "Ananas": "yellow", "Avocado": "green",
  "Wassermelone": "red", "Kiwi": "green", "Datteln": "orange", "Feige": "purple",
  "Granatapfel": "red",

  // ── Brot & Backwaren ─────────────────────────────────────────────────────
  "Brot": "orange", "Vollkornbrot": "orange", "Toastbrot": "yellow", "Baguette": "orange",
  "Brötchen": "orange", "Fladenbrot": "yellow", "Tortillas": "yellow", "Wraps": "yellow",
  "Knäckebrot": "orange", "Zwieback": "yellow", "Croissant": "yellow", "Burgerbrötchen": "orange",

  // ── Fleisch & Fisch ──────────────────────────────────────────────────────
  "Rindergulasch": "red", "Rinderhackfleisch": "red", "Gemischtes Hackfleisch": "red",
  "Rinderfilet": "red", "Rumpsteak": "red", "Rinderbraten": "red",
  "Schweinefilet": "red", "Schweineschnitzel": "red", "Schweinebauch": "red", "Kasseler": "red",
  "Hähnchenbrust": "yellow", "Hähnchenschenkel": "yellow", "Hähnchenkeule": "yellow",
  "Ganzes Hähnchen": "yellow", "Putenbrust": "yellow", "Entenbrust": "red",
  "Lammkeule": "red", "Lammkotelett": "red", "Speck": "red", "Speckwürfel": "red",
  "Bacon": "red", "Schinken": "red", "Kochschinken": "red", "Serranoschinken": "red",
  "Salami": "red", "Bratwurst": "yellow", "Chorizo": "red", "Leberwurst": "orange",
  "Lachsfilet": "orange", "Kabeljau": "yellow", "Seelachs": "yellow", "Forelle": "yellow",
  "Garnelen": "yellow", "Muscheln": "blue", "Tintenfisch": "yellow", "Räucherlachs": "orange",

  // ── Kühlregal ────────────────────────────────────────────────────────────
  "Milch": "yellow", "Vollmilch": "yellow", "H-Milch": "yellow", "Buttermilch": "yellow",
  "Kefir": "yellow", "Sahne": "yellow", "Schlagsahne": "yellow", "Crème fraîche": "yellow",
  "Schmand": "yellow", "Saure Sahne": "yellow", "Joghurt": "yellow", "Naturjoghurt": "yellow",
  "Griechischer Joghurt": "yellow", "Skyr": "yellow", "Quark": "yellow", "Magerquark": "yellow",
  "Frischkäse": "yellow", "Butter": "yellow", "Margarine": "yellow", "Butterschmalz": "yellow",
  "Schweineschmalz": "yellow", "Eier": "yellow",
  "Gouda": "yellow", "Emmentaler": "yellow", "Bergkäse": "yellow", "Mozzarella": "yellow",
  "Feta": "yellow", "Parmesan": "yellow", "Pecorino": "yellow", "Ricotta": "yellow",
  "Mascarpone": "yellow", "Gorgonzola": "yellow", "Camembert": "yellow", "Brie": "yellow",
  "Halloumi": "yellow", "Reibekäse": "yellow", "Frische Hefe": "orange", "Tofu": "yellow",
  "Räuchertofu": "orange", "Blätterteig": "yellow", "Pizzateig": "yellow",
  "Hafermilch": "yellow", "Sojamilch": "yellow", "Mandelmilch": "yellow", "Hummus": "yellow",

  // ── Tiefkühl ─────────────────────────────────────────────────────────────
  "TK-Erbsen": "green", "TK-Spinat": "green", "TK-Blattspinat": "green",
  "TK-Beeren": "purple", "TK-Himbeeren": "red", "TK-Gemüse": "green",
  "Pommes frites": "yellow", "Fischstäbchen": "orange", "Vanilleeis": "yellow",
  "Blätterteig (TK)": "yellow",

  // ── Konserven & Gläser ───────────────────────────────────────────────────
  "Tomatenmark": "red", "Passierte Tomaten": "red", "Gehackte Tomaten": "red",
  "Dosentomaten": "red", "Kokosmilch": "yellow", "Kidneybohnen": "red",
  "Kichererbsen (Dose)": "yellow", "Weiße Bohnen": "yellow", "Mais": "yellow",
  "Oliven": "green", "Kapern": "green", "Gewürzgurken": "green", "Sauerkraut": "yellow",
  "Rotkohl (Glas)": "purple", "Thunfisch (Dose)": "yellow", "Sardellen": "orange",
  "Erdnussbutter": "orange", "Marmelade": "red", "Honig": "yellow", "Apfelmus": "yellow",
  "Pesto": "green", "Ajvar": "red", "Gemüsebrühe": "yellow", "Rinderbrühe": "orange",
  "Hühnerbrühe": "yellow", "Brühe": "yellow", "Fond": "orange", "Kalbsfond": "orange",
  "Tomatensauce": "red", "Sardinen": "yellow",

  // ── Nudeln, Reis & Trockenware ───────────────────────────────────────────
  "Nudeln": "yellow", "Spaghetti": "yellow", "Penne": "yellow", "Fusilli": "yellow",
  "Tagliatelle": "yellow", "Lasagneplatten": "yellow", "Spätzle": "yellow",
  "Reis": "yellow", "Basmatireis": "yellow", "Risottoreis": "yellow", "Milchreis": "yellow",
  "Couscous": "yellow", "Bulgur": "orange", "Quinoa": "yellow", "Polenta": "yellow",
  "Haferflocken": "yellow", "Müsli": "orange", "Cornflakes": "yellow", "Linsen": "orange",
  "Rote Linsen": "red", "Belugalinsen": "orange", "Berglinsen": "green",
  "Semmelbrösel": "orange", "Paniermehl": "orange", "Mehl": "yellow", "Weizenmehl": "yellow",
  "Dinkelmehl": "yellow", "Vollkornmehl": "orange", "Grieß": "yellow", "Speisestärke": "yellow",
  "Kartoffelstärke": "yellow", "Saucenbinder": "yellow", "Walnüsse": "orange",
  "Haselnüsse": "orange", "Mandeln": "orange", "Gemahlene Mandeln": "yellow",
  "Cashewkerne": "yellow", "Pinienkerne": "yellow", "Sonnenblumenkerne": "orange",
  "Kürbiskerne": "orange", "Sesam": "yellow", "Leinsamen": "orange", "Chiasamen": "orange",
  "Rosinen": "purple", "Trockenhefe": "orange", "Backpulver": "yellow", "Natron": "yellow",
  "Kokosraspeln": "yellow", "Getrocknete Tomaten": "red", "getrocknete Aprikosen": "orange",

  // ── Backen & Süßes ───────────────────────────────────────────────────────
  "Zucker": "yellow", "Puderzucker": "yellow", "Brauner Zucker": "orange",
  "Vanillezucker": "yellow", "Vanilleschote": "orange", "Vanilleextrakt": "orange",
  "Zartbitterschokolade": "orange", "Vollmilchschokolade": "orange", "Kuvertüre": "orange",
  "Schokoladenraspel": "orange", "Kakaopulver": "orange", "Marzipan": "yellow",
  "Gelatine": "yellow", "Agar-Agar": "yellow", "Ahornsirup": "orange",
  "Agavendicksaft": "yellow", "Zuckerrübensirup": "orange", "Rohrzucker": "orange",

  // ── Gewürze, Öle & Saucen ────────────────────────────────────────────────
  "Salz": "yellow", "Meersalz": "yellow", "Pfeffer": "orange", "schwarzer Pfeffer": "orange",
  "Paprikapulver": "red", "Currypulver": "yellow", "scharfes Currypulver": "red",
  "Kurkuma": "yellow", "Kreuzkümmel": "orange", "Kümmel": "orange", "Koriandersamen": "orange",
  "Muskatnuss": "orange", "Zimt": "orange", "Nelken": "orange", "Gewürznelke": "orange",
  "Kardamom": "green", "Lorbeerblatt": "green", "Lorbeerblätter": "green",
  "Wacholderbeeren": "purple", "Wacholderbeere": "purple", "Senfkörner": "yellow",
  "Chiliflocken": "red", "Cayennepfeffer": "red", "Getrockneter Oregano": "green",
  "Getrockneter Thymian": "green", "Getrockneter Rosmarin": "green", "Majoran": "green",
  "Italienische Kräuter": "green", "Kräuter der Provence": "green", "Currypaste": "red",
  "Olivenöl": "green", "Rapsöl": "yellow", "Sonnenblumenöl": "yellow", "Sesamöl": "yellow",
  "Kokosöl": "yellow", "Essig": "yellow", "Bratöl": "yellow", "Balsamico": "orange",
  "Weißweinessig": "yellow", "Apfelessig": "yellow", "Senf": "yellow", "Dijonsenf": "yellow",
  "Ketchup": "red", "Mayonnaise": "yellow", "Sojasauce": "orange", "Fischsauce": "orange",
  "Worcestershiresauce": "orange", "Tabasco": "red", "Sriracha": "red", "Harissa": "red",
  "Tahini": "yellow", "Zitronensaft": "yellow", "Gemahlener Kreuzkümmel": "orange",

  // ── Getränke ─────────────────────────────────────────────────────────────
  "Mineralwasser": "blue", "Wasser": "blue", "Rotwein": "red", "Weißwein": "yellow",
  "Sekt": "yellow", "Bier": "yellow", "Apfelsaft": "yellow", "Orangensaft": "orange",
  "Tomatensaft": "red", "Kaffee": "orange", "Espresso": "orange", "Tee": "yellow",
  "Cola": "orange", "Tonic Water": "blue", "Wodka": "blue", "Rum": "orange",
  "Weinbrand": "orange", "Portwein": "purple", "Sherry": "yellow", "Mirin": "yellow",

  // ── Haushalt ─────────────────────────────────────────────────────────────
  "Backpapier": "orange", "Alufolie": "yellow", "Frischhaltefolie": "yellow",
  "Küchenrolle": "yellow", "Gefrierbeutel": "blue", "Zahnstocher": "yellow",
  "Küchengarn": "orange", "Müllbeutel": "orange", "Spülmittel": "blue",
};

export function colorFor(name) {
  return COLORS[name] ?? "yellow";
}

/**
 * Komplementärpaare auf dem (vereinfachten Sechs-Ton-)Farbkreis.
 */
export const COMPLEMENT = {
  green: "red", red: "green",
  yellow: "purple", purple: "yellow",
  orange: "blue", blue: "orange",
};

/**
 * "same" = Hintergrund in der Eigenfarbe der Zutat (Banane auf Pastellgelb) —
 * entschieden nach Vergleich mit "complement" (Gegenton, z. B. Banane auf
 * Pastelllila): Eigenfarbe wirkt als Familie ruhiger, das war die Wahl.
 */
export const BACKGROUND_MODE = "same";

export function backgroundColorFor(name) {
  const own = colorFor(name);
  return BACKGROUND_MODE === "complement" ? COMPLEMENT[own] : own;
}

export function hexFor(name) {
  return PALETTE[backgroundColorFor(name)].hex;
}

/**
 * Ein Template fuer alle: nur so sehen die Bilder wie eine Familie aus.
 * Fotorealistisch, freigestellt auf einem einfarbigen, hellen Pastellgrund
 * ohne Verlauf — die Farbe kommt fest aus COLORS/PALETTE, nicht vom Modell
 * geraten, damit gleichfarbige Zutaten (Tomate, Erdbeeren) denselben
 * Hintergrund bekommen.
 */
export const buildPrompt = (subject, name) => {
  const { prompt: background } = PALETTE[backgroundColorFor(name)];
  return (
    `Photorealistic professional food product photograph of ${subject}, ` +
    `centered in frame, isolated on a completely flat, uniform ${background} ` +
    "background with absolutely no gradient — one single flat pastel color " +
    "fills the entire background edge to edge. Soft realistic shadow directly " +
    "beneath the subject on the background. Studio lighting on the subject " +
    "itself, sharp focus, high detail, natural colours, no text, no labels, " +
    "no hands, no props, no other objects."
  );
};
