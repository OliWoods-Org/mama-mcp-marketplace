# @foundation/rare-dx-mcp

MCP server for rare disease support — match symptoms to disease candidates, find clinical trials, look up gene and variant data, and locate specialists and centers of excellence.

## Tools

| Tool | Description |
|---|---|
| `symptom_match` | Match symptoms to rare disease candidates with diagnostic hints and next steps |
| `find_clinical_trials` | Find relevant trials on ClinicalTrials.gov and alternative registries |
| `gene_lookup` | Associated conditions, inheritance, testing options, and variant guidance for a gene |
| `find_specialist` | Locate medical geneticists, centers of excellence, and patient advocacy organizations |

## Usage

```json
{
  "mcpServers": {
    "foundation-rare-dx": {
      "command": "npx",
      "args": ["-y", "@foundation/rare-dx-mcp"]
    }
  }
}
```

## Development

```bash
npm install
npm run build
npm start
```

---

Open source by **OliWoods Foundation**
