import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getData } from "./api-client.js";
import { log } from "@acdh-oeaw/lib";

// fetch data from github ; variable with the URL
const baseUrl =
  "https://raw.githubusercontent.com/jerusalem-70-ad/jad-baserow-dump/refs/heads/main/data/";

const fileNames = [
  "manuscripts.json",
  "keywords.json",
  "passages.json",
  "works.json",
  "institutional_contexts.json",
  "libraries.json",
  "authors.json",
  "biblical_references.json",
  "clusters.json",
  "dates.json",
  "liturgical_references.json",
  "ms_occurrences.json",
  "sources_occurrences.json",
];

// async function to fetch the data from the url

async function fetchAllData() {
  // make a folder to store the data - use process.cwd to get the root (node operates from the root), concatinate src etc. - node knows to put / or \
  const folderPath = join(process.cwd(), "src", "content", "data");
  mkdirSync(folderPath, { recursive: true });

  // iterate over the fileNames, for each we call the function fetchData - which receives two parameters - fileName and folderPath
  const promises = fileNames.map(async (fileName) => {
    await fetchData(fileName, folderPath);
  });
  log.success(`All files have been fetched and stored in ${folderPath}`);

  // since we are awaiting  promises is an array of promises. Use the method promise.all():
  // takes an iterable of promises as input and returns a single Promise. Returns an array of the fulfillment values.

  await Promise.all(promises);
}

async function fetchData(fileName, folderPath) {
  // handle rejected awaits with try {...} catch {...}
  try {
    const data = await getData(baseUrl, fileName);

    // save them in content/manuscripts.json 1) convert the data object into a json string (parameter 2 for indentation - make it readable)
    const mss = JSON.stringify(data, null, 2);
    writeFileSync(join(folderPath, fileName), mss, { encoding: "utf-8" });
  } catch (error) {
    log.error("Error while fetching data:\n", String(error));
  }
}
// function to get ai generated biblical references (different baseUrl)
async function fetchAIbibl() {
  try {
    const folderPath = join(process.cwd(), "src", "content", "data");
    mkdirSync(folderPath, { recursive: true });
    const response = await fetch(
      "https://raw.githubusercontent.com/jerusalem-70-ad/jad-ai/refs/heads/main/out/all_in_one.json"
    );
    if (!response.ok) {
      throw new Error("API issues " + response.statusText + "\n" + fullUrl);
    }
    const data = await response.json();
    const jsonString = JSON.stringify(data, null, 2);
    writeFileSync(join(folderPath, "ai_bibl_ref.json"), jsonString, {
      encoding: "utf-8",
    });
    log.success(`AI ref file has been fetched and stored in ${folderPath}`);
  } catch (error) {
    log.error("Error while fetching ai bibl ref data:\n", String(error));
  }
}

// Call both functions
async function fetchAllDatasets() {
  await fetchAllData();
  await fetchAIbibl();
}

fetchAllDatasets();
