import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getData } from "./api-client.js";

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
  "authors.json",
];

// async function to fetch the data from the url

async function fetchAllData() {
  // make a folder to store the data - use process.cwd to get the root (node operates fro the root), concatinate src etc. - node knows to put / or \
  const folderPath = join(process.cwd(), "src", "content", "data");
  mkdirSync(folderPath, { recursive: true });

  // iterate over the fileNames, for each we call the function fetchData - which receives two parameters - fileName and folderPath
  const promises = fileNames.map(async (fileName) => {
    await fetchData(fileName, folderPath);
  });
  console.log(`All files have been fetched and stored in ${folderPath}`);

  // since we are awaiting  promises is an array of promises. Use the method promise.all():
  // takes an iterable of promises as input and returns a single Promise. Returns an array of the fulfillment values.

  await Promise.all(promises);

  // for (const url of urls) {
  //   const fullUrl = baseUrl + url;
  //   await fetchData(fullUrl, folderPath);
  // }
}

async function fetchData(fileName, folderPath) {
  // handle rejected awaits with try {...} catch {...}
  try {
    const data = await getData(baseUrl, fileName);

    // save them in content/manuscripts.json 1) convert the data object into a json string (parameter 2 for indentation - make it readable)
    const mss = JSON.stringify(data, null, 2);
    writeFileSync(join(folderPath, fileName), mss, { encoding: "utf-8" });
  } catch (error) {
    console.error(error);
  }
}

// Call the async function to fetch the data
fetchAllData();
