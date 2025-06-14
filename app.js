class MindMirrorJournal {
    constructor() {
        this.initializeElements();
        this.initializeStorage();
        this.initializeVoiceRecognition();
        this.bindEvents();
        this.loadHistory();
        this.updateStats();
        this.checkOnlineStatus();
        
        // Quotes database
        this.quotes = [
            { text: "The unexamined life is not worth living.", author: "Socrates" },
            { text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi" },
            { text: "The only way out is through.", author: "Robert Frost" },
            { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
            { text: "The curious paradox is that when I accept myself just as I am, then I can change.", author: "Carl Rogers" },
            { text: "Your present circumstances don't determine where you can go; they merely determine where you start.", author: "Nido Qubein" },
            { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
            { text: "Between stimulus and response there is a space. In that space is our power to choose our response.", author: "Viktor Frankl" },
            { text: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung" },
            { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
            { text: "The wound is the place where the Light enters you.", author: "Rumi" },
            { text: "What we think, we become.", author: "Buddha" },
            { text: "The greatest revolution of our generation is the discovery that human beings can alter their lives by altering their attitudes of mind.", author: "William James" },
            { text: "Everything can be taken from a man but one thing: the last of human freedoms - to choose one's attitude in any given set of circumstances.", author: "Viktor Frankl" },
            { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" }
        ];
    }

    initializeElements() {
        this.journalInput = document.getElementById('journalInput');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.resultsSection = document.getElementById('resultsSection');
        this.summaryResult = document.getElementById('summaryResult');
        this.questionsResult = document.getElementById('questionsResult');
        this.reframingResult = document.getElementById('reframingResult');
        this.quoteText = document.getElementById('quoteText');
        this.quoteAuthor = document.getElementById('quoteAuthor');
        this.historyContainer = document.getElementById('historyContainer');
        this.offlineIndicator = document.getElementById('offlineIndicator');
        this.totalEntries = document.getElementById('totalEntries');
        this.currentStreak = document.getElementById('currentStreak');
        this.weeklyEntries = document.getElementById('weeklyEntries');
    }

    initializeStorage() {
        // Load entries from localStorage if available
        try {
            const savedEntries = localStorage.getItem('mindmirror_entries');
            this.entries = savedEntries ? JSON.parse(savedEntries) : [];
            
            const savedStats = localStorage.getItem('mindmirror_stats');
            this.stats = savedStats ? JSON.parse(savedStats) : {
                totalEntries: 0,
                lastEntryDate: null,
                currentStreak: 0,
                weeklyEntries: 0
            };
            
            // Load draft if exists
            const savedDraft = localStorage.getItem('mindmirror_draft');
            if (savedDraft) {
                this.journalInput.value = savedDraft;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.entries = [];
            this.stats = {
                totalEntries: 0,
                lastEntryDate: null,
                currentStreak: 0,
                weeklyEntries: 0
            };
        }
    }

    initializeVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.voiceBtn.classList.add('recording');
                this.voiceBtn.textContent = '🔴 Recording...';
                this.voiceStatus.textContent = 'Listening...';
            };
            
            this.recognition.onend = () => {
                this.voiceBtn.classList.remove('recording');
                this.voiceBtn.textContent = '🎤 Start Voice Input';
                this.voiceStatus.textContent = '';
            };
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (finalTranscript) {
                    this.journalInput.value += finalTranscript + ' ';
                    this.saveProgress();
                }
                
                this.voiceStatus.textContent = interimTranscript;
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.voiceStatus.textContent = 'Voice input error. Please try again.';
            };
        } else {
            this.voiceBtn.style.display = 'none';
        }
    }

    bindEvents() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeEntry());
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Auto-save on input
        this.journalInput.addEventListener('input', () => {
            this.saveProgress();
        });

        // Online/offline detection
        window.addEventListener('online', () => this.handleOnlineStatus());
        window.addEventListener('offline', () => this.handleOnlineStatus());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to analyze
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.analyzeBtn.click();
            }
            
            // Ctrl/Cmd + M for voice input
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                this.voiceBtn.click();
            }
        });
    }

    toggleVoiceInput() {
        if (!this.recognition) return;
        
        if (this.voiceBtn.classList.contains('recording')) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    async analyzeEntry() {
        const text = this.journalInput.value.trim();
        if (!text) {
            alert('Please write something first!');
            return;
        }

        this.analyzeBtn.disabled = true;
        this.analyzeBtn.innerHTML = '<div class="loading"><div class="spinner"></div> Analyzing your thoughts...</div>';

        try {
            // Show a random quote immediately
            this.displayRandomQuote();
            
            if (navigator.onLine) {
                await this.performAIAnalysis(text);
            } else {
                this.performOfflineAnalysis(text);
            }
            
            // Save entry
            this.saveEntry(text);
            this.loadHistory();
            this.updateStats();
            
            // Clear input and draft
            this.journalInput.value = '';
            localStorage.removeItem('mindmirror_draft');
            
            // Show results
            this.resultsSection.style.display = 'block';
            this.resultsSection.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.performOfflineAnalysis(text);
            this.saveEntry(text);
            this.resultsSection.style.display = 'block';
        }

        this.analyzeBtn.disabled = false;
        this.analyzeBtn.textContent = '✨ Reflect with AI';
    }

    async performAIAnalysis(text) {
        // Using Hugging Face Inference API for text analysis
        const prompt = `Analyze this journal entry and provide:
1. A brief summary of the person's emotional state and main themes
2. 3-4 thoughtful questions for self-reflection
3. A positive reframing or encouraging perspective

Journal entry: "${text}"

Please respond in JSON format with keys: summary, questions (array), reframing`;

        try {
            // Using Hugging Face API key
            const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";
            const API_KEY = "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";
            
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },
                body: JSON.stringify({ inputs: prompt })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const result = await response.json();
            
            // Parse the response to extract JSON
            let jsonMatch;
            try {
                // Try to find JSON in the response
                jsonMatch = result.generated_text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonData = JSON.parse(jsonMatch[0]);
                    
                    this.summaryResult.textContent = jsonData.summary || "No summary available";
                    
                    this.questionsResult.innerHTML = '';
                    if (jsonData.questions && Array.isArray(jsonData.questions)) {
                        jsonData.questions.forEach(question => {
                            const li = document.createElement('li');
                            li.textContent = question;
                            this.questionsResult.appendChild(li);
                        });
                    } else {
                        this.questionsResult.innerHTML = '<li>What patterns do you notice in your thoughts?</li>';
                    }
                    
                    this.reframingResult.textContent = jsonData.reframing || "No reframing available";
                    return;
                }
            } catch (e) {
                console.error('Error parsing JSON from API response:', e);
            }
            
            // If JSON parsing fails, fall back to offline analysis
            throw new Error('Failed to parse API response');
            
        } catch (error) {
            console.error('AI analysis error:', error);
            // Fallback to offline analysis
            this.performOfflineAnalysis(text);
        }
    }

    performOfflineAnalysis(text) {
        // Advanced offline analysis using pattern matching and sentiment analysis
        const words = text.toLowerCase().split(/\s+/);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        
        // Emotion detection
        const emotions = this.detectEmotions(words);
        const sentiment = this.analyzeSentiment(words);
        
        // Generate summary
        const summary = this.generateSummary(emotions, sentiment, sentences.length);
        
        // Generate reflection questions
        const questions = this.generateQuestions(emotions, text);
        
        // Generate positive reframing
        const reframing = this.generateReframing(sentiment, emotions);
        
        // Display results
        this.summaryResult.textContent = summary;
        this.questionsResult.innerHTML = questions.map(q => `<li>${q}</li>`).join('');
        this.reframingResult.textContent = reframing;
    }

    detectEmotions(words) {
        const emotionWords = {
            joy: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'cheerful', 'elated', 'content', 'pleased', 'glad'],
            sadness: ['sad', 'depressed', 'down', 'blue', 'melancholy', 'grief', 'sorrow', 'despair', 'lonely', 'upset'],
            anxiety: ['anxious', 'worried', 'stressed', 'nervous', 'panic', 'fear', 'concerned', 'tense', 'uneasy', 'overwhelmed'],
            anger: ['angry', 'mad', 'furious', 'irritated', 'frustrated', 'annoyed', 'rage', 'upset', 'livid', 'bitter'],
            gratitude: ['grateful', 'thankful', 'blessed', 'appreciate', 'fortunate', 'lucky', 'privilege', 'honor'],
            hope: ['hope', 'optimistic', 'confident', 'positive', 'bright', 'future', 'better', 'improve', 'growth']
        };

        const detected = {};
        for (const [emotion, emotionWordList] of Object.entries(emotionWords)) {
            detected[emotion] = words.filter(word => emotionWordList.some(ew => word.includes(ew))).length;
        }

        return detected;
    }

    analyzeSentiment(words) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 'beautiful', 'success', 'win', 'achieve', 'accomplish', 'proud', 'confident'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'fail', 'failure', 'wrong', 'difficult', 'hard', 'struggle', 'problem', 'issue', 'challenge'];

        const positiveCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
        const negativeCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    generateSummary(emotions, sentiment, sentenceCount) {
        const dominantEmotion = Object.entries(emotions).reduce((a, b) => emotions[a[0]] > emotions[b[0]] ? a : b)[0];
        
        const summaries = {
            joy: "You're experiencing positive emotions and seem to be in a good headspace. There's a sense of happiness and contentment in your thoughts.",
            sadness: "You're processing some difficult emotions right now. It's natural to feel this way, and acknowledging these feelings is an important step.",
            anxiety: "You seem to be dealing with some stress or worry. Your mind appears to be processing concerns about current or future situations.",
            anger: "You're experiencing some frustration or anger. These intense emotions often signal that something important to you needs attention.",
            gratitude: "There's a beautiful sense of appreciation and thankfulness in your reflection. You're recognizing the positive aspects of your life.",
            hope: "You're showing resilience and optimism. Even if facing challenges, there's a forward-looking perspective in your thoughts."
        };

        return summaries[dominantEmotion] || "You're taking time to reflect on your experiences and emotions, which shows great self-awareness and emotional intelligence.";
    }

    generateQuestions(emotions, text) {
        const hasGoals = text.toLowerCase().includes('goal') || text.toLowerCase().includes('want') || text.toLowerCase().includes('hope');
        const hasChallenges = text.toLowerCase().includes('problem') || text.toLowerCase().includes('difficult') || text.toLowerCase().includes('struggle');
        const hasRelationships = text.toLowerCase().includes('friend') || text.toLowerCase().includes('family') || text.toLowerCase().includes('people');

        const questionPool = [
            "What patterns do you notice in your emotional responses?",
            "How might you approach this situation differently next time?",
            "What would you tell a friend who was experiencing something similar?",
            "What are three things you're grateful for right now?",
            "How have you grown from similar experiences in the past?",
            "What support or resources might help you with this situation?",
            "What values are most important to you in handling this?",
            "How might this experience be preparing you for future challenges?",
            "What would 'future you' want 'present you' to know?",
            "What small step could you take today to move forward?"
        ];

        const specificQuestions = [];
        if (hasGoals) specificQuestions.push("What concrete steps can you take to move closer to your goals?");
        if (hasChallenges) specificQuestions.push("What lessons might this challenge be teaching you?");
        if (hasRelationships) specificQuestions.push("How do your relationships influence your current state of mind?");

        // Combine specific and general questions
        const allQuestions = [...specificQuestions, ...questionPool];
        return allQuestions.slice(0, 4);
    }

    generateReframing(sentiment, emotions) {
        const reframings = {
            positive: [
                "Your positive outlook is a strength that can help you navigate any challenges that come your way. Continue to nurture this optimistic perspective.",
                "The joy and contentment you're experiencing is something to celebrate and remember during more difficult times."
            ],
            negative: [
                "While you're facing difficulties now, remember that emotions are temporary and this challenging period will pass. You have the strength to get through this.",
                "These difficult feelings are valid and important. They're providing you with valuable information about what matters to you and what might need to change.",
                "Every challenge is an opportunity for growth. The resilience you're building now will serve you well in the future."
            ],
            neutral: [
                "Your balanced perspective shows emotional maturity. You're processing your experiences thoughtfully and with awareness.",
                "Taking time to reflect like this demonstrates self-care and emotional intelligence. You're investing in your mental well-being."
            ]
        };

        const options = reframings[sentiment] || reframings.neutral;
        return options[Math.floor(Math.random() * options.length)];
    }

    displayRandomQuote() {
        const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        this.quoteText.textContent = randomQuote.text;
        this.quoteAuthor.textContent = `— ${randomQuote.author}`;
    }

    saveEntry(text) {
        const entry = {
            id: Date.now(),
            text: text,
            date: new Date().toISOString(),
            summary: this.summaryResult.textContent,
            reframing: this.reframingResult.textContent
        };

        this.entries.unshift(entry);
        
        // Keep only last 50 entries
        if (this.entries.length > 50) {
            this.entries = this.entries.slice(0, 50);
        }
        
        // Save to localStorage
        try {
            localStorage.setItem('mindmirror_entries', JSON.stringify(this.entries));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    saveProgress() {
        // Auto-save draft
        try {
            localStorage.setItem('mindmirror_draft', this.journalInput.value);
        } catch (error) {
            console.error('Error saving draft to localStorage:', error);
        }
    }

    loadHistory() {
        this.historyContainer.innerHTML = '';
        
        const recentEntries = this.entries.slice(0, 5);
        
        if (recentEntries.length === 0) {
            this.historyContainer.innerHTML = '<p style="text-align: center; color: #6b7280; font-style: italic;">No entries yet. Start by sharing your thoughts above!</p>';
            return;
        }

        recentEntries.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(entry.date);
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            historyItem.innerHTML = `
                <div class="history-date">${dateStr}</div>
                <div class="history-text">${entry.text.substring(0, 200)}${entry.text.length > 200 ? '...' : ''}</div>
            `;
            
            this.historyContainer.appendChild(historyItem);
        });
    }

    updateStats() {
        this.stats.totalEntries = this.entries.length;
        
        // Calculate streak
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        let streak = 0;
        let checkDate = new Date();
        let foundToday = false;
        
        // Check if there's an entry today
        for (const entry of this.entries) {
            const entryDate = new Date(entry.date).toDateString();
            if (entryDate === today) {
                foundToday = true;
                break;
            }
        }
        
        if (foundToday) {
            streak = 1;
            
            // Check for consecutive previous days
            for (let i = 1; i <= 365; i++) { // Check up to a year back
                const checkDate = new Date(Date.now() - i * 86400000).toDateString();
                let foundEntry = false;
                
                for (const entry of this.entries) {
                    const entryDate = new Date(entry.date).toDateString();
                    if (entryDate === checkDate) {
                        foundEntry = true;
                        break;
                    }
                }
                
                if (foundEntry) {
                    streak++;
                } else {
                    break;
                }
            }
        }
        
        this.stats.currentStreak = streak;
        
        // Calculate weekly entries
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        this.stats.weeklyEntries = this.entries.filter(entry => 
            new Date(entry.date) > weekAgo
        ).length;
        
        // Update UI
        this.totalEntries.textContent = this.stats.totalEntries;
        this.currentStreak.textContent = this.stats.currentStreak;
        this.weeklyEntries.textContent = this.stats.weeklyEntries;
        
        // Save stats to localStorage
        try {
            localStorage.setItem('mindmirror_stats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Error saving stats to localStorage:', error);
        }
    }

    checkOnlineStatus() {
        this.handleOnlineStatus();
    }

    handleOnlineStatus() {
        if (navigator.onLine) {
            this.offlineIndicator.style.display = 'none';
        } else {
            this.offlineIndicator.style.display = 'block';
        }
    }

    exportData() {
        const dataStr = JSON.stringify({
            entries: this.entries,
            stats: this.stats,
            exportDate: new Date().toISOString()
        }, null, 2);
        
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `mindmirror-journal-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.entries && Array.isArray(data.entries)) {
                this.entries = data.entries;
                this.stats = data.stats || this.stats;
                
                // Save to localStorage
                localStorage.setItem('mindmirror_entries', JSON.stringify(this.entries));
                localStorage.setItem('mindmirror_stats', JSON.stringify(this.stats));
                
                this.loadHistory();
                this.updateStats();
                alert('Data imported successfully!');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Error importing data. Please check the file format.');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.mindMirror = new MindMirrorJournal();
    
    // Add export/import buttons
    const exportImportContainer = document.createElement('div');
    exportImportContainer.className = 'export-import-btns';
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'voice-btn';
    exportBtn.innerHTML = '💾 Export Data';
    exportBtn.onclick = () => window.mindMirror.exportData();
    
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                window.mindMirror.importData(e.target.result);
            };
            reader.readAsText(file);
        }
    };
    
    const importBtn = document.createElement('button');
    importBtn.className = 'voice-btn';
    importBtn.innerHTML = '📁 Import Data';
    importBtn.onclick = () => importInput.click();
    
    exportImportContainer.appendChild(exportBtn);
    exportImportContainer.appendChild(importBtn);
    document.body.appendChild(exportImportContainer);
    document.body.appendChild(importInput);
    
    // Show tips for first-time users
    setTimeout(() => {
        if (window.mindMirror.entries.length === 0) {
            const tip = document.createElement('div');
            tip.className = 'tip-box';
            tip.innerHTML = `
                <strong>💡 Quick Tips:</strong><br>
                • Press Ctrl+Enter to analyze<br>
                • Press Ctrl+M for voice input<br>
                • Your data is saved locally<br>
                • Works offline too!
            `;
            document.body.appendChild(tip);
            
            setTimeout(() => {
                tip.style.opacity = '0';
                setTimeout(() => tip.remove(), 500);
            }, 5000);
        }
    }, 2000);
});