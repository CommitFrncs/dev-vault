const fs = require("fs");

// URL detection
function detectCategory(content) {
  if (content.startsWith("http://") || content.startsWith("https://")) {
    return "link";
  }

  // API key detection
  const apiKeyPrefixes = [
    "sk-",
    "ghp_",
    "gho_",
    "AIza",
    "pk-",
    "ak-",
    "sk_live",
    "sk_test",
  ];
  const hasKnownPrefix = apiKeyPrefixes.some((prefix) =>
    content.startsWith(prefix),
  );
  if (hasKnownPrefix) {
    return "api_key";
  }

  // Code snippet detection
  const codeSnippetIndicators = [
    "function",
    "const",
    "let",
    "var",
    "class",
    "import",
    "export",
    "{",
    "}",
    ";",
    "style",
    "stylesheet",
    "head",
    "body",
    "html",
    "meta",
    "title",
    "script",
  ];
  const hasCodeSnippetIndicator = codeSnippetIndicators.some((indicator) =>
    content.includes(indicator),
  );
  if (hasCodeSnippetIndicator) {
    return "code_snippet";
  }

  // Generic API detection
  const punctuation = [".", ",", "?", "!"];
  const hasNoPunctuation = punctuation.every((char) => !content.includes(char));
  const hasNoSpaces = !content.includes(" ");
  const isLongEnough = content.length > 25 && content.length < 1000;

  const isGenericApi = isLongEnough && hasNoSpaces && hasNoPunctuation;
  if (isGenericApi) {
    return "generic_api";
  }
  return "note";
}

function createEntry(content, project) {
  const category = detectCategory(content);
  const now = new Date();
  const entry = {
    content: content,
    category: category,
    project: project,
    createdAt: now.toISOString(),
    time: now.toLocaleTimeString(),
  };
  return entry;
}

let vault = [];

if (fs.existsSync("vault.json")) {
  const fileContent = fs.readFileSync("vault.json", "utf8");
  vault = JSON.parse(fileContent);
}

vault.push(createEntry(process.argv[2], process.argv[3]));

fs.writeFileSync("vault.json", JSON.stringify(vault, null, 2));