# J·AD 70

**J·AD 70** is an application designed in connection with the project '[Medieval Reception of the Roman Conquest of Jerusalem](https://www.oeaw.ac.at/acdh/research/dh-research-infrastructure/activities/data-management-preservation/jad)'. This project examines the medieval reception and interpretation of the Roman conquest of Jerusalem in 70 AD by the emperors Titus and Vespasian, which ended a Jewish revolt and destroyed the Jewish Temple.

## Getting Started

### Prerequisites

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

### Deployment
To deploy the project, ensure your build process outputs to the `dist/` directory. This project is suitable for deployment on platforms like GitHub Pages or other static hosting services.

## Project Structure

Inside the Astro project, you’ll find the following structure:

```plaintext
/
├── public/           # Static assets like images and fonts
├── scripts/          # Custom scripts for data processing
├── src/              # Main source directory
│   ├── components/   # Reusable UI components (e.g., header, footer)
│   ├── content/      # JSON data and dynamic content
│   ├── layouts/      # Layout components for pages
│   ├── lib/          # Helper libraries and utilities
│   └── pages/        # Pages and routes for the application
│       ├── authors/          # Author-related pages
│       ├── institutions/     # Institution-related pages
│       ├── keywords/         # Keyword-related pages
│       ├── manuscripts/      # Manuscript-related pages
│       ├── passages/         # Passage-related pages
│       ├── works/            # Work-related pages
│       ├── about.astro       # About page
│       ├── advanced-search.astro # Advanced search page
│       ├── imprint.astro     # Imprint page
│       └── index.astro       # Home page
├── tailwind.config.mjs       # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project metadata and dependencies
```

Astro automatically maps `.astro` or `.md` files in the `src/pages/` directory to routes. For example, `index.astro` maps to `/`, and `manuscripts/index.astro` maps to `/manuscripts/`.

### Advanced Search
The advanced search functionality allows users to explore data in a detailed manner. It integrates custom logic for filtering and sorting based on JSON data.

## 🧞 Commands

All commands should be run from the root of the project directory:

| Command                    | Action                                           |
| :------------------------- | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`                 | Starts local dev server at `localhost:3000`      |
| `pnpm build`               | Builds the production site to `./dist/`          |
| `pnpm run preview`         | Previews the production build locally            |
| `pnpm run astro ...`       | Runs Astro CLI commands                         |
| `pnpm run astro -- --help` | Displays help for the Astro CLI                  |

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

