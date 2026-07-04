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

// Console logs for testing the function
console.log(detectCategory("https://github.com"));
console.log(detectCategory("sk-1234567890abcdef"));
console.log(detectCategory("console.log('hello world');"));
console.log(
  detectCategory(
    "<div style='color: red; padding: 10px;'><h1>Hello</h1></div>",
  ),
);
console.log(detectCategory("This is a valid submission for the client"));
console.log(
  detectCategory(
    "This is a fairly long sentence that a user might type as a note, with punctuation.",
  ),
);
console.log(detectCategory("hello world"));
