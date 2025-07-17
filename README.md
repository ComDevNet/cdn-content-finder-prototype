# CDN Content Finder (Prototype)

This is a web application built with Next.js that leverages the power of generative AI to function as an intelligent content aggregator. Users can input a topic and specify a target audience, and the application will perform a live internet search, gather relevant information, generate a comprehensive text, create an accompanying image, check for grammatical errors, and allow the content to be exported in multiple formats.

## Tech Stack

- **Framework**: Next.js (with App Router)
- **UI Library**: React
- **Styling**: Tailwind CSS
- **Components**: ShadCN UI
- **AI Backend**: Genkit
- **AI Models**: Google AI (Gemini)
- **Live Search**: Serper API for Google Search results

## Core Features

- **Live Web Search**: Performs a real-time internet search for the user's topic to find up-to-date sources.
- **AI Content Aggregation**: Gathers and synthesizes information from search results, tailored to a specific audience level.
- **AI Content Continuation**: Extends the initially generated text with new, relevant information.
- **AI Image Generation**: Creates a unique, high-quality image based on the user's topic.
- **AI Grammar & Style Check**: Analyzes the generated content and provides suggestions for improvement, with an "Apply" feature.
- **Multiple Export Options**: Download the final content as a styled PDF, a structured JSON, a clean Markdown file, or a DOCX Word document.
- **Image Download**: Download the generated image directly.

## How It Works: Application Architecture

The application follows a modern web architecture, separating the client-side user interface from the server-side AI logic. Here is a detailed breakdown of how the different parts work together.

### 1. Frontend (`app/content-aggregator-client.tsx`)

This is the main user interface component, built using React and ShadCN UI components. It's the central hub for all user interaction.

- **State Management**: It uses React hooks (`useState`) to manage the application's state, including loading indicators for various operations (`isLoading`, `isGeneratingImage`, etc.), the user's input (prompt and audience level), and the final outputs (the aggregated text, the generated image URL, and grammar suggestions).
- **Form Handling**: It uses `react-hook-form` with `zod` for schema validation to ensure that user input for the prompt and audience level is valid before any requests are made.
- **Triggering Actions**: When a user clicks a button (e.g., "Start Gathering," "Generate Image"), the component calls the corresponding asynchronous `handle...` function imported from `app/actions.ts`. It then updates the UI based on the result, showing a loading spinner during the operation and displaying the content, image, or an error message (via a "toast" notification) upon completion.

### 2. Server Actions (`app/actions.ts`)

These functions act as a secure bridge between the frontend (client) and the backend AI flows (server). They are a key feature of the Next.js App Router.

- **Security & Separation**: By using server actions, the AI logic and API keys are never exposed to the user's browser. The client simply calls a function, and the server handles the secure execution.
- **Input Validation**: Before invoking an AI flow, each `handle...` function performs basic server-side validation on the input (e.g., checking that a prompt isn't too long or empty).
- **Flow Invocation**: The primary role of an action is to call the appropriate Genkit flow function (e.g., `gatherRelevantContent`, `generateImage`) and pass along the necessary data.
- **Error Handling**: This is a critical responsibility. The actions are wrapped in a `try...catch` block. If an AI flow throws an error (e.g., due to a safety filter or API issue), the action catches it, logs the detailed error on the server for debugging purposes, and returns a simple, user-friendly error message to the client to be displayed in a toast notification.

### 3. Genkit & AI Flows (`ai/`)

This is the core of the application's intelligence, powered by Genkit.

- **`ai/genkit.ts`**: This file initializes Genkit and configures the `googleAI` plugin. This makes the Gemini family of models available to the application and sets a default model to be used.

- **`ai/flows/gather-relevant-content.ts`**: This is a multi-step flow that acts as an AI research assistant:

  1. It first calls a function (`searchInternet`) that performs a **live internet search** using the Serper API to get a list of up-to-date sources.
  2. For each search result, it uses an AI prompt (`searchResultRelevancePrompt`) to **decide if the source is relevant** to the user's topic and audience. This acts as an AI-powered filter.
  3. It compiles all the relevant sources and feeds them into the powerful `summarizeContentPrompt`. This prompt instructs the AI to act as a professor writing a comprehensive, well-structured textbook chapter on the topic, ensuring the language and complexity are tailored to the specified `audienceLevel`.

- **`ai/flows/continue-content-flow.ts`**: This flow is designed for extending content.

  - It takes the original prompt, audience level, and, most importantly, the **existing generated text** as context.
  - It uses a specialized `continueContentPrompt` that instructs the AI to seamlessly continue writing from where the previous text left off, explicitly telling it **not to repeat information** or use introductory phrases.

- **`ai/flows/generate-image-flow.ts`**: This flow uses a specialized image generation model (`gemini-2.0-flash-preview-image-generation`).

  - It takes the user's topic and uses a refined prompt that guides the AI to create a high-quality, relevant illustration suitable for educational material.
  - The image is returned not as a file, but as a **Data URI** (a long string of text representing the image), which can be directly used in the `src` attribute of an `<img>` tag in the browser.

- **`src/ai/flows/grammar-check-flow.ts`**: This flow turns the AI into an expert proofreader.

  - It takes the generated text and uses the `grammarCheckPrompt` to analyze it.
  - The prompt asks the AI to identify issues and return a structured list (an array of objects) containing the problematic text, a suggestion for correction, and an explanation. This structured output makes it easy to display the results cleanly in the UI.

### 4. Components (`components/`)

The application uses reusable React components for various UI elements and functionalities. Key components include:

- **Download Buttons**: `pdf-download-button.tsx`, `json-download-button.tsx`, `markdown-download-button.tsx`, `docx-download-button.tsx` and `image-download-button.tsx` each handle the specific logic for creating and triggering the download of the content in their respective formats.
- **`markdown-display.tsx`**: This component takes the raw Markdown text from the AI and uses the `react-markdown` library to render it as styled HTML, applying custom styles for headings, lists, code blocks, etc.
- **UI Components (`components/ui/`)**: These are the standard, pre-built ShadCN components used to construct the interface (e.g., `Button`, `Card`, `Input`, `Select`).

## How to Run the Application

1. **Prerequisites**:

   - Node.js and npm installed.
   - A Google AI API key.
   - A Serper API key.

2. **Environment Setup**:

   - Create a `.env` file in the root of the project by copying the `.env.example` file if one exists, or creating it from scratch.
   - Add your API keys to this file:

     ```env
     # Get your Google AI key from: https://aistudio.google.com/app/apikey
     GOOGLE_API_KEY=your_google_api_key_here

     # Get your free Serper key from: https://serper.dev
     SERPER_API_KEY=your_serper_api_key_here
     ```

3. **Install Dependencies**:

   ```bash
   bun install
   ```

4. **Run Development Servers**:
   You need to run two processes in separate terminals:

   - **Next.js Frontend**:

     ```bash
     bun run dev
     ```

     This will start the web application, usually on `http://localhost:9002`.

Now you can open your browser to the Next.js URL and start using the application.
