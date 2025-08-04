# Crypto News AI Agent

A Node.js script that fetches the latest cryptocurrency news headlines from CryptoPanic API, summarizes them using the DeepSeek API, and logs the summarized results to the console.

## Features

- 📰 Fetches real-time crypto news headlines from CryptoPanic API
- 🤖 Uses DeepSeek AI for intelligent news summarization
- 📱 Sends summaries to Telegram chat via bot API
- ⏰ Automated daily execution at 8:00 AM via cron job
- 🔧 Configurable via environment variables
- 📊 Provides both raw headlines and AI-generated summaries
- 🛡️ Secure API key management with dotenv
- 📈 Includes sentiment analysis and currency tracking
- 🔄 Automatic fallback to mock data if API fails

## Prerequisites

- Node.js (version 16 or higher)
- DeepSeek API key (via OpenRouter)
- CryptoPanic API key (free at https://cryptopanic.com/developers/api/)
- Telegram Bot Token (optional - for notifications)

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env and add your API keys
   DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
   CRYPTOPANIC_API_KEY=your_cryptopanic_api_key_here
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   TELEGRAM_CHAT_ID=your_telegram_chat_id_here
   ```

## Usage

### Basic Usage
```bash
npm start
```

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Daemon Mode (with cron job)
```bash
npm run daemon
```

### Direct Node Execution
```bash
node index.js
```

## Configuration

You can customize the behavior by modifying the `.env` file:

- `DEEPSEEK_API_KEY`: Your DeepSeek API key (via OpenRouter) (required)
- `CRYPTOPANIC_API_KEY`: Your CryptoPanic API key (required)
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (optional)
- `TELEGRAM_CHAT_ID`: Your Telegram chat ID (optional)
- `NEWS_COUNT`: Number of news headlines to fetch (default: 10)
- `NEWS_SENTIMENT`: Filter news by sentiment (positive, negative, important) (default: important)

## Automated Execution

The application includes a cron job that automatically runs the crypto news summarization every day at 8:00 AM UTC. When you start the application:

1. **Immediate Execution**: Runs the news summarization immediately for testing
2. **Scheduled Execution**: Sets up a cron job to run daily at 8:00 AM UTC
3. **Continuous Operation**: Keeps the application running to execute scheduled tasks

### Cron Schedule
- **Pattern**: `0 8 * * *` (every day at 8:00 AM UTC)
- **Timezone**: UTC
- **Logging**: All scheduled executions are logged with timestamps

## Example Output

```
🚀 Starting Crypto News Summarization...

📰 Fetching latest crypto news headlines...
✅ Fetched 10 news articles

📋 Raw News Headlines:
1. Bitcoin Surges Past $50,000 as Institutional Adoption Grows
   Source: CryptoNews
   Published: 1/15/2024, 10:30:00 AM
   Currencies: BTC
   Sentiment Score: 85
   URL: https://example.com/bitcoin-surge

2. Ethereum 2.0 Upgrade Shows Promising Results in Testnet
   Source: BlockchainDaily
   Published: 1/15/2024, 9:15:00 AM
   Currencies: ETH
   Sentiment Score: 78
   URL: https://example.com/ethereum-upgrade

...

🤖 Generating AI-powered summary...

📊 AI-GENERATED SUMMARY:
==================================================
The cryptocurrency market is experiencing significant developments across multiple fronts:

**Main Themes:**
- Bitcoin's price surge and institutional adoption
- Ethereum 2.0 progress and technical improvements
- Traditional finance integration with crypto services
- Regulatory developments and compliance

**Key Market Developments:**
- Bitcoin crossed the $50,000 threshold, driven by institutional investment
- Ethereum 2.0 testnet shows improved performance metrics
- Major banks entering crypto custody services
- DeFi protocols achieving record TVL growth

**Notable Trends:**
- Increasing institutional adoption of cryptocurrencies
- Focus on regulatory compliance and framework development
- Growing interest in Layer 2 scaling solutions
- Expansion of CBDC pilot programs globally

**Sentiment Analysis:**
- Overall positive sentiment with scores ranging from 65-92
- Strong positive sentiment around institutional adoption news
- Moderate sentiment for regulatory developments

**Market Implications:**
- Continued institutional adoption may drive further price appreciation
- Regulatory clarity could reduce market volatility
- Technical improvements may enhance user experience and adoption
- Cross-chain interoperability advances could expand DeFi ecosystem

==================================================

✅ News summarization completed successfully!
```

## Project Structure

```
crypto-news-agent/
├── index.js          # Main script
├── package.json      # Dependencies and scripts
├── env.example       # Environment variables template
├── .env              # Your environment variables (create this)
└── README.md         # This file
```

## API Integration

The script now uses the CryptoPanic API to fetch real-time cryptocurrency news. The integration includes:

- **Real-time news**: Fetches latest headlines from CryptoPanic
- **Sentiment filtering**: Filter by positive, negative, or important news
- **Currency tracking**: Shows which cryptocurrencies are mentioned in each article
- **Fallback system**: Automatically falls back to mock data if API fails

### Getting a CryptoPanic API Key

1. Visit https://cryptopanic.com/developers/api/
2. Sign up for a free account
3. Generate your API key
4. Add it to your `.env` file

### Setting up Telegram Notifications

1. **Create a Telegram Bot**:
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Follow the instructions to create your bot
   - Copy the bot token provided

2. **Get your Chat ID**:
   - Message @userinfobot on Telegram
   - It will reply with your chat ID
   - Copy the chat ID

3. **Add to your `.env` file**:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

### Alternative APIs

If you want to integrate with other crypto news APIs, you can modify the `fetchCryptoNews()` function in `index.js`. Some alternatives include:

- CoinGecko News API
- CryptoCompare News API
- NewsAPI.org (with crypto filters)

## Error Handling

The script includes comprehensive error handling for:
- Missing API keys
- DeepSeek API errors
- Network connectivity issues
- Invalid environment variables

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for your own purposes.

## Security Notes

- Never commit your `.env` file to version control
- Keep your DeepSeek API key secure and rotate it regularly
- Consider using API key restrictions in your DeepSeek account settings 