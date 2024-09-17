import { writeFileSync } from "fs";

// fetch data from github ; variable with the URL
const url =
  "https://jerusalem-70-ad.github.io/jad-python-static/data/manuscripts.json";

// async function to fetch the data from the url
async function fetchData() {
  // handle rejected awaits with try {...} catch {...}
  try {
    const response = await fetch(url);
    // check for API errors:
    if (!response.ok) {
      throw new Error("API issues" + response.statusText);
    }

    const data = await response.json(); // need to parse the JSON
    // console.log(data["36"]); // visualize the JSON data;
    // save them in content/manuscripts.json 1) convert the data object into a json string (parameter 2 for indentation - make it readable)
    const mss = JSON.stringify(data, null, 2);
    // use fs writeFileSync to write the data in the initially empty json - give path, data to be written, encoding
    writeFileSync("../content/manuscripts/allManuscripts.json", mss, "utf8");
  } catch (error) {
    console.error(error);
  }
}

// Call the async function to fetch the data
fetchData();
