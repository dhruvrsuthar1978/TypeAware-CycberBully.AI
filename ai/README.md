# TypeAware AI - Cyberbullying Detection System

Advanced AI-powered system for detecting, preventing, and moderating cyberbullying and harmful online behavior.

## 🚀 Quick Start

### Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Or install as package
python setup.py install
```

### Start API Server
```bash
# Quick start
python run_server.py

# Or with custom config
MONGODB_URL=mongodb://localhost:27017 python run_server.py
```

### Basic Usage
```python
from ai import TypeAwareEngine, AnalysisRequest

# Initialize engine
engine = TypeAwareEngine()

# Analyze content
result = engine.analyze_content(AnalysisRequest(
    content="Your message here",
    user_id="user123",
    platform="web"
))

print(f"Should block: {result.should_block}")
print(f"Risk score: {result.risk_score}")
print(f"Suggestions: {result.suggestions}")
```

## 🎯 Features

- **Real-time Detection**: Instant analysis of typed messages
- **Obfuscation Detection**: Detects disguised text like "id!ot", "s t u p i d"
- **Context Analysis**: Understanding of conversation context and intent  
- **Behavioral Patterns**: Detects escalating harassment and coordinated attacks
- **Smart Suggestions**: Positive rephrasing alternatives
- **Multi-platform**: Works across Twitter, Discord, Facebook, etc.
- **Privacy-First**: On-device processing, anonymous tracking

## 🏗️ Architecture

```
ai/
├── detection/          # Core detection engines
├── nlp/               # Natural language processing
├── suggestions/       # Rephrasing engine
├── real_time/         # Stream processing
├── integration/       # Backend integration
└── utils/            # Utilities
```

## 🔧 API Endpoints

- `POST /api/v1/analyze` - Analyze single message
- `POST /api/v1/stream` - Real-time stream processing
- `POST /api/v1/batch` - Batch analysis
- `GET /health` - Health check
- `GET /stats` - System statistics

## 🎛️ Configuration

```python
config = {
    'blocking_threshold': 0.7,
    'high_risk_threshold': 0.8,
    'enable_suggestions': True,
    'mongodb_url': 'mongodb://localhost:27017'
}
```

## 📊 Dashboard Integration

```javascript
// Frontend integration
fetch('/api/v1/analyze', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        content: userMessage,
        user_id: userId,
        platform: 'web'
    })
})
.then(r => r.json())
.then(result => {
    if (result.should_block) {
        showWarning(result.suggestions);
    }
});
```

## 🧠 AI Components

1. **Content Detection** - Keyword and pattern matching
2. **Obfuscation Detection** - Handles disguised text
3. **Sentiment Analysis** - Emotional tone analysis
4. **Pattern Analysis** - Behavioral pattern detection
5. **Context Analysis** - Intent and situational understanding
6. **Rephrasing Engine** - Positive suggestion generation

## 🔒 Privacy & Security

- No personal data stored
- Anonymous user tracking via UUIDs
- On-device processing when possible
- GDPR compliant
- Encrypted data transmission

## 🚀 Deployment

### Docker
```bash
docker build -t typeaware-ai .
docker run -p 8000:8000 typeaware-ai
```

### Production
```bash
gunicorn ai.integration.api_interface:app --workers 4 --bind 0.0.0.0:8000
```

## 📈 Monitoring

- Real-time processing statistics
- User behavior analytics
- System performance metrics
- Alert management dashboard

## 🤝 Integration Examples

### Node.js Backend
```javascript
const axios = require('axios');

const analyzeMessage = async (content, userId) => {
    const response = await axios.post('http://localhost:8000/api/v1/analyze', {
        content,
        user_id: userId,
        platform: 'web'
    });
    return response.data;
};
```

### React Frontend
```jsx
const MessageInput = () => {
    const [message, setMessage] = useState('');
    
    const handleSubmit = async () => {
        const result = await analyzeMessage(message, userId);
        if (result.should_block) {
            setWarning(result.educational_message);
            setSuggestions(result.suggestions);
        } else {
            submitMessage(message);
        }
    };
};
```

## 📝 License

MIT License - Built for educational safety and digital wellness.

## 🆘 Support

- Documentation: `/docs`
- API Reference: `/redoc`  
- Health Check: `/health`
- Issues: GitHub Issues

---

**TypeAware AI** - Making the internet safer, one message at a time. 🛡️