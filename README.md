# J·AD 70

**J·AD 70** is an application developed as part of the project '[Medieval Reception of the Roman Conquest of Jerusalem](https://www.oeaw.ac.at/acdh/research/dh-research-infrastructure/activities/data-management-preservation/jad)'. The project examines the medieval reception and interpretation of the Roman conquest of Jerusalem in 70 AD.

The project's primary objective is to identify and analyze references to this historic event in both edited texts and unedited manuscripts. To facilitate this, the principal investigator (PI) utilizes a relational database powered by Baserow. This database enables the documentation of his findings and their connections to relevant works, authors, institutional settings, manuscripts, keywords, as well as biblical and liturgical references.

Data from the Baserow database is exported daily in JSON format to a [sister repository](https://github.com/jerusalem-70-ad/jad-baserow-dump), where it undergoes processing. The refined data is then integrated into this application (see src/content/data) to ensure it is accessible, searchable, and openly available to users.

## :dizzy: Getting Started

### :point_right: Prerequisites

1. **Package Manager**: This project uses `pnpm`. To install it, run:
   ```bash
   npm install -g pnpm
   ```
2. **Clone the Repository**:
   ```bash
   git clone https://github.com/jerusalem-70-ad/jad-astro.git
   cd jad-astro
   ```
3. **Install Dependencies**:
   ```bash
   pnpm install
   ```
4. **Configuration**:
   Ensure that the base path in `astro.config.mjs` is correctly set. For this project, the base path is `"/jad-astro"`.
5. **Run Locally**:
   Start the development server:
   ```bash
   pnpm run dev
   ```
6. :warning: **Get fresh data**
   It might be a good idea to run the data-fetch.js script which pulls fresh json files from a [sister repository](https://github.com/jerusalem-70-ad/jad-baserow-dump)
   ```bash
   pnpm get-data
   ```

### :rocket: Deployment

To deploy the project, ensure your build process outputs to the dist/ directory. This project is currently deployed to GitHub Pages using the build.yml script. The deployment process involves fetching data, generating the Typesense index, building the website, and uploading the static files as an artifact for deployment.

## :building_construction: Project Structure

Inside the Astro project, you’ll find the following structure:

```plaintext
/
├── public/           # Static assets like images
├── scripts/          # Custom scripts for data processing
├── src/              # Main source directory
│   ├── components/   # Reusable UI components (e.g., header, footer)
│   ├── content/      # JSON data
│   ├── layouts/      # Layout components for pages
│   ├── lib/          # Helper libraries and utilities
│   └── pages/        # Pages and routes for the application
│       ├── authors/          # Author-related dynamic page template
│       ├── institutions/     # Institution-related dynamic page template
│       ├── keywords/         # Keyword-related dynamic page template
│       ├── manuscripts/      # Manuscript-related dynamic page template
│       ├── passages/         # Passage-related dynamic page template
│       ├── works/            # Work-related dynamic page template
│       ├── about.astro       # About page
│       ├── advanced-search.astro # Advanced search page
│       ├── imprint.astro     # Imprint page
│       └── index.astro       # Home page
├── tailwind.config.mjs       # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project metadata and dependencies
```

Astro automatically maps `.astro` or `.md` files in the `src/pages/` directory to routes. For example, `index.astro` maps to `/`, and `manuscripts/[id].astro` maps to `/manuscripts/[id]`.

### :mag: Advanced Search

The advanced search functionality allows users to explore data in detail. The search engine is powered by Typesense, which indexes the main dataset, passages.json. The indexing process is handled by a custom script, generate-search-index.js, located in the scripts/ folder. This script defines a schema for the data but requires API keys, which are not included in the repository for security reasons.

The search interface itself is implemented in src/pages/advanced-search.astro, where standard Algolia widgets are utilized to provide a user-friendly and highly customizable search experience. Users can filter, sort, and search the indexed data efficiently through this interface.

## 🧞 Commands

All commands should be run from the root of the project directory:

| Command                    | Action                                      |
| :------------------------- | :------------------------------------------ |
| `pnpm install`             | Installs dependencies                       |
| `pnpm dev`                 | Starts local dev server at `localhost:3000` |
| `pnpm build`               | Builds the production site to `./dist/`     |
| `pnpm run preview`         | Previews the production build locally       |
| `pnpm run astro ...`       | Runs Astro CLI commands                     |
| `pnpm run astro -- --help` | Displays help for the Astro CLI             |

## :bulb: Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and open a pull request.

## :raised_hands: License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/jerusalem-70-ad/jad-astro/blob/main/LICENSE.txt) file for details.
