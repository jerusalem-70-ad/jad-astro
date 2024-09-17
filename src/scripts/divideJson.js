import { writeFileSync, readFileSync } from "fs";
const originalData = readFileSync(
  "../content/manuscripts/allManuscripts.json",
  { encoding: "utf-8" }
);
// use JSON.parse to convert from JSON to one huge object
const mssData = JSON.parse(originalData);
console.log(mssData["2"]["jad_id"]);
// we can access it by calling the keys.
//Need to use the method Object.values() to return an array of the values (the values in this case are the single mss descriptions as objects)
const mssValues = Object.values(mssData);
// iterate over it, write single files with the jad_id as path, use JSON.stringify to convert the object to json, use encoding utf8.
mssValues.forEach((entry) => {
  writeFileSync(
    `../content/manuscripts/${entry["jad_id"]}.json`,
    JSON.stringify(entry, null, 2),
    "utf8"
  );
});
