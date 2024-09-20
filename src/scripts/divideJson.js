import { writeFileSync, readFileSync } from "fs";
const originalData = readFileSync("../content/originalData/allPassages.json", {
  encoding: "utf-8",
});
// use JSON.parse to convert from JSON to one huge object
const passageData = JSON.parse(originalData);
console.log(passageData["2"]["jad_id"]);
// we can access it by calling the keys.
//Need to use the method Object.values() to return an array of the values (the values in this case are the single mss descriptions as objects)
const passagesValues = Object.values(passageData);
// iterate over it, write single files with the jad_id as path, use JSON.stringify to convert the object to json, use encoding utf8.
passagesValues.forEach((entry) => {
  writeFileSync(
    `../content/passages/${entry["jad_id"]}.json`,
    JSON.stringify(entry, null, 2),
    "utf8"
  );
});
