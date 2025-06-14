# 🧘‍♂️ MindMirror: Reflective AI Journal

MindMirror is a frontend-only web application that serves as an AI-powered reflective journal for mindful self-discovery.

## Features

- **AI-Powered Reflection**: Enter your thoughts and receive:
  - Summary of your feelings
  - Questions for deeper reflection
  - Positive reframing of your experiences
  - Relevant philosophical/historical quotes

- **Voice Input**: Use the Web Speech API to dictate your journal entries

- **Offline Support**: Works without an internet connection using:
  - Service Workers
  - LocalStorage for data persistence
  - Offline analysis fallback when API is unavailable

- **Progress Tracking**:
  - Journal entry statistics
  - Day streak counter
  - Weekly entry tracking

- **Data Management**:
  - Export your journal data
  - Import previously saved journals

## Technical Implementation

- **Frontend Only**: No server/backend required
- **Hugging Face API**: Uses free Hugging Face Inference API for AI analysis
- **PWA Features**: Installable on mobile devices with offline functionality
- **LocalStorage**: Persists user data in the browser
- **Web Speech API**: Enables voice input for journal entries

## Getting Started

1. Clone this repository
2. Open `index.html` in your browser or deploy to GitHub Pages
3. (Optional) Add your Hugging Face API key in `app.js` for enhanced AI analysis

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Analyze journal entry
- `Ctrl/Cmd + M`: Toggle voice input

## Deployment

This application can be deployed on GitHub Pages or any static hosting service.

## License

MIT