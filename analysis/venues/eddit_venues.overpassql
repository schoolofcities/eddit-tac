[out:json][timeout:60];

// --- Define the area (Toronto) ---
area["name"="Toronto"]->.searchArea;
 
// --- Fetch cultural venues across amenity, tourism, leisure, building, and other keys ---
(
  // Amenity (performing arts & community)
  node["amenity"~"^(theatre|arts_centre|concert_hall|music_school|studio|cinema|library)$"](area.searchArea);
  way ["amenity"~"^(theatre|arts_centre|concert_hall|music_school|studio|cinema|library)$"](area.searchArea);
  relation["amenity"~"^(theatre|arts_centre|concert_hall|music_school|studio|cinema|library)$"](area.searchArea);
 
  // Tourism (galleries & museums)
  node["tourism"~"^(gallery|museum)$"](area.searchArea);
  way ["tourism"~"^(gallery|museum)$"](area.searchArea);
  relation["tourism"~"^(gallery|museum)$"](area.searchArea);
 
  // Leisure (auditorium, amphitheatre)
  node["leisure"~"^(auditorium|amphitheatre)$"](area.searchArea);
  way ["leisure"~"^(auditorium|amphitheatre)$"](area.searchArea);
  relation["leisure"~"^(auditorium|amphitheatre)$"](area.searchArea);
 
  // Building (cultural)
  node["building"="cultural"](area.searchArea);
  way ["building"="cultural"](area.searchArea);
  relation["building"="cultural"](area.searchArea);
 
  // Shops (ancillary spaces)
  node["shop"~"^(books|music|craft)$"](area.searchArea);
  way ["shop"~"^(books|music|craft)$"](area.searchArea);
  relation["shop"~"^(books|music|craft)$"](area.searchArea);
 
);
 
// --- Output full geometry for mapping ---
out body;
>;
out skel qt;
 
// {{style:
// /* ===== Live Performance Spaces ===== */
// node[amenity=theatre], way[amenity=theatre], relation[amenity=theatre] { color:#d73027; fill-color:#d73027; }
// node[amenity=concert_hall], way[amenity=concert_hall], relation[amenity=concert_hall] { color:#fc8d59; fill-color:#fc8d59; }
// node[amenity=arts_centre], way[amenity=arts_centre], relation[amenity=arts_centre] { color:#fee090; fill-color:#fee090; }
 
// /* ===== Music/Studios ===== */
// node[amenity=music_school], way[amenity=music_school], relation[amenity=music_school] { color:#e0f3f8; fill-color:#e0f3f8; }
// node[amenity=studio], way[amenity=studio], relation[amenity=studio] { color:#abd9e9; fill-color:#abd9e9; }
 
// /* ===== Presentation & Exhibition ===== */
// node[tourism=gallery], way[tourism=gallery], relation[tourism=gallery] { color:#91bfdb; fill-color:#91bfdb; }
// node[tourism=museum], way[tourism=museum], relation[tourism=museum] { color:#4575b4; fill-color:#4575b4; }
// node[amenity=cinema], way[amenity=cinema], relation[amenity=cinema] { color:#74add1; fill-color:#74add1; }
 
// /* ===== Event/Gathering Spaces ===== */
// node[amenity=community_centre], way[amenity=community_centre], relation[amenity=community_centre] { color:#7fc97f; fill-color:#7fc97f; }
// node[leisure=auditorium], way[leisure=auditorium], relation[leisure=auditorium] { color:#beaed4; fill-color:#beaed4; }
// node[leisure=stadium], way[leisure=stadium], relation[leisure=stadium] { color:#fdae61; fill-color:#fdae61; }
// node[leisure=amphitheatre], way[leisure=amphitheatre], relation[leisure=amphitheatre] { color:#f46d43; fill-color:#f46d43; }
 
// /* ===== Multi-purpose ===== */
// node[amenity=library], way[amenity=library], relation[amenity=library] { color:#ffffbf; fill-color:#ffffbf; }
// node[amenity=place_of_worship], way[amenity=place_of_worship], relation[amenity=place_of_worship] { color:#d9ef8b; fill-color:#d9ef8b; }
 
// /* ===== Cultural Buildings ===== */
// node[building=cultural], way[building=cultural], relation[building=cultural] { color:#fdc086; fill-color:#fdc086; }
 
// /* ===== Ancillary (shops) ===== */
// node[shop=books], way[shop=books], relation[shop=books] { color:#b8e186; fill-color:#b8e186; }
// node[shop=music], way[shop=music], relation[shop=music] { color:#66bd63; fill-color:#66bd63; }
// node[shop=craft], way[shop=craft], relation[shop=craft] { color:#1a9850; fill-color:#1a9850; }
 
// /* ===== Parks & Plazas ===== */
// node[leisure=park], way[leisure=park], relation[leisure=park] { color:#a6d96a; fill-color:#a6d96a; }
// node[amenity=public_square], way[amenity=public_square], relation[amenity=public_square] { color:#fddbc7; fill-color:#fddbc7; }
 
// /* ===== Symbology niceties ===== */
// node { icon-size: 12; }
// way, relation { width: 2; opacity: 0.85; }
// }}