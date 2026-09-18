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
const BOWL = (what) => `a small plain white ceramic bowl filled with ${what}`;
const JAR = (what) => `a small clear glass jar of ${what}`;
const GLASS = (what) => `a plain clear drinking glass of ${what}`;

export const SUBJECTS = {
  // ── Obst & Gemüse ────────────────────────────────────────────────────────
  "Zwiebel": "a whole yellow onion", "Rote Zwiebel": "a whole red onion",
  "Schalotte": "two brown shallots", "Frühlingszwiebel": "a bunch of spring onions",
  "Knoblauch": "a whole garlic bulb", "Karotte": "a fresh carrot with green top",
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
  "Butterschmalz": JAR("clarified butter"), "Eier": "three brown chicken eggs",
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
  "Getrocknete Tomaten": BOWL("sun dried tomatoes"),

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
  "Pfeffer": BOWL("black peppercorns"), "Paprikapulver": BOWL("red paprika powder"),
  "Currypulver": BOWL("yellow curry powder"), "Kurkuma": BOWL("golden turmeric powder"),
  "Kreuzkümmel": BOWL("cumin seeds"), "Kümmel": BOWL("caraway seeds"),
  "Koriandersamen": BOWL("coriander seeds"), "Muskatnuss": "two whole nutmegs",
  "Zimt": "a few cinnamon sticks", "Nelken": BOWL("whole cloves"),
  "Kardamom": BOWL("green cardamom pods"), "Lorbeerblatt": "a few dried bay leaves",
  "Wacholderbeeren": BOWL("juniper berries"), "Senfkörner": BOWL("yellow mustard seeds"),
  "Chiliflocken": BOWL("red chili flakes"), "Cayennepfeffer": BOWL("cayenne pepper powder"),
  "Getrockneter Oregano": BOWL("dried oregano"), "Getrockneter Thymian": BOWL("dried thyme"),
  "Getrockneter Rosmarin": BOWL("dried rosemary"), "Majoran": BOWL("dried marjoram"),
  "Italienische Kräuter": BOWL("dried italian herb mix"), "Kräuter der Provence": BOWL("herbes de provence"),
  "Currypaste": JAR("red curry paste"), "Olivenöl": JAR("green olive oil"),
  "Rapsöl": JAR("rapeseed oil"), "Sonnenblumenöl": JAR("sunflower oil"),
  "Sesamöl": JAR("sesame oil"), "Kokosöl": JAR("solid coconut oil"), "Essig": JAR("clear vinegar"),
  "Balsamico": JAR("dark balsamic vinegar"), "Weißweinessig": JAR("white wine vinegar"),
  "Apfelessig": JAR("apple cider vinegar"), "Senf": JAR("yellow mustard"),
  "Dijonsenf": JAR("dijon mustard"), "Ketchup": JAR("tomato ketchup"),
  "Mayonnaise": JAR("mayonnaise"), "Sojasauce": JAR("dark soy sauce"),
  "Fischsauce": JAR("fish sauce"), "Worcestershiresauce": JAR("worcestershire sauce"),
  "Tabasco": JAR("hot red pepper sauce"), "Sriracha": JAR("sriracha chili sauce"),
  "Harissa": JAR("red harissa paste"), "Tahini": JAR("sesame tahini paste"),
  "Zitronensaft": GLASS("lemon juice"), "Gemahlener Kreuzkümmel": BOWL("ground cumin"),

  // ── Getränke ─────────────────────────────────────────────────────────────
  "Mineralwasser": GLASS("sparkling water"), "Rotwein": "a glass of red wine",
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

/** Ein Template fuer alle: nur so sehen 350 Bilder wie eine Familie aus. */
export const STYLE =
  "centered on a pure white seamless background, soft even studio lighting, " +
  "subtle soft shadow directly beneath, food product photography, sharp focus, " +
  "high detail, natural colours, no text, no labels, no hands, no props";

export const buildPrompt = (subject) => `${subject}, ${STYLE}`;
