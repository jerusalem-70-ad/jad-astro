import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// fetch data from github ; variable with the URL
const baseUrl =
  "https://raw.githubusercontent.com/jerusalem-70-ad/jad-baserow-dump/refs/heads/main/data/";

const fileNames = [
  "manuscripts.json",
  "keywords.json",
  "passages.json",
  "works.json",
  "institutional_context.json",
  "libraries.json",
];

// async function to fetch the data from the url

async function fetchAllData() {
  // use fs writeFileSync to write the data in the initially empty json - give path, data to be written, encoding
  const folderPath = join(process.cwd(), "src", "content", "originalData");
  mkdirSync(folderPath, { recursive: true });

  const promises = fileNames.map(async (fileName) => {
    await fetchData(fileName, folderPath);
  });

  await Promise.all(promises);

  // for (const url of urls) {
  //   const fullUrl = baseUrl + url;
  //   await fetchData(fullUrl, folderPath);
  // }
}

async function fetchData(fileName, folderPath) {
  // handle rejected awaits with try {...} catch {...}
  try {
    const fullUrl = baseUrl + fileName;
    const response = await fetch(fullUrl);
    // check for API errors:
    if (!response.ok) {
      throw new Error("API issues " + response.statusText + "\n" + fullUrl);
    }

    // we could use streams
    // reponse.body => fs.createWriteStream(filePath)

    const data = await response.json(); // need to parse the JSON
    // console.log(data["36"]); // visualize the JSON data;
    // save them in content/manuscripts.json 1) convert the data object into a json string (parameter 2 for indentation - make it readable)
    const mss = JSON.stringify(data, null, 2);
    writeFileSync(join(folderPath, fileName), mss, { encoding: "utf-8" });
  } catch (error) {
    console.error(error);
  }
}

// Call the async function to fetch the data
fetchAllData();
