import dotenv from 'dotenv';
import fetch from 'node-fetch';
import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

// CryptoPanic API configuration
const CRYPTOPANIC_BASE_URL = 'https://cryptopanic.com/api/developer/v2';

/**
 * Fetch crypto news headlines from CryptoPanic API
 * @returns {Array} Array of news articles
 */
async function fetchCryptoNews() {
  try {
    const apiKey = process.env.CRYPTOPANIC_API_KEY;
    const newsCount = parseInt(process.env.NEWS_COUNT) || 10;
    const sentiment = process.env.NEWS_SENTIMENT || 'important';
    
    if (!apiKey) {
      throw new Error('CRYPTOPANIC_API_KEY is not set in environment variables. Please check your .env file.');
    }

    // Build API URL with parameters - v2 API structure
    const url = `${CRYPTOPANIC_BASE_URL}/posts/?auth_token=${apiKey}`;
    
    console.log(`🔗 API URL: ${url}`);
    
    console.log(`🔗 Fetching news from CryptoPanic API...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CryptoPanic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('🔍 API Response structure:', JSON.stringify(data, null, 2));
    
    // Handle both v1 and v2 API response formats
    const results = data.results || data.data || [];
    
    if (!Array.isArray(results)) {
      throw new Error('Invalid response format from CryptoPanic API');
    }

    // Transform CryptoPanic v2 data to our format
    const newsArticles = results.slice(0, newsCount).map(article => ({
      title: article.title,
      source: article.source?.title || 'Unknown Source',
      publishedAt: article.published_at,
      summary: article.description || 'General Crypto News',
      url: `https://cryptopanic.com/news/${article.slug}/`,
      sentiment: 0, // v2 API doesn't provide sentiment in the same way
      currencies: [] // v2 API doesn't provide currencies in the same way
    }));

    return newsArticles;
    
  } catch (error) {
    console.error('Error fetching news from CryptoPanic:', error.message);
    
    // Fallback to mock data if API fails
    console.log('⚠️  Falling back to mock data...');
    return getMockCryptoNews();
  }
}

/**
 * Get mock crypto news data as fallback
 * @returns {Array} Array of mock news articles
 */
function getMockCryptoNews() {
  return [
    {
      title: "Bitcoin Surges Past $50,000 as Institutional Adoption Grows",
      source: "CryptoNews",
      publishedAt: "2024-01-15T10:30:00Z",
      summary: "Bitcoin has reached a new milestone, crossing the $50,000 mark for the first time in months, driven by increased institutional investment and positive market sentiment.",
      url: "https://example.com/bitcoin-surge",
      sentiment: 85,
      currencies: ["BTC"]
    },
    {
      title: "Ethereum 2.0 Upgrade Shows Promising Results in Testnet",
      source: "BlockchainDaily",
      publishedAt: "2024-01-15T09:15:00Z",
      summary: "The latest Ethereum 2.0 testnet deployment has demonstrated significant improvements in transaction speed and reduced gas fees, signaling a successful transition to proof-of-stake.",
      url: "https://example.com/ethereum-upgrade",
      sentiment: 78,
      currencies: ["ETH"]
    },
    {
      title: "Major Bank Announces Plans to Offer Crypto Custody Services",
      source: "FinanceCrypto",
      publishedAt: "2024-01-15T08:45:00Z",
      summary: "A leading global bank has revealed its intention to provide cryptocurrency custody services, marking a significant step toward mainstream financial institution adoption of digital assets.",
      url: "https://example.com/bank-crypto",
      sentiment: 92,
      currencies: ["BTC", "ETH"]
    },
    {
      title: "DeFi Protocol Reports Record-Breaking TVL Growth",
      source: "DeFiInsider",
      publishedAt: "2024-01-15T07:20:00Z",
      summary: "A prominent decentralized finance protocol has achieved unprecedented total value locked (TVL), indicating growing confidence in DeFi platforms and yield farming strategies.",
      url: "https://example.com/defi-growth",
      sentiment: 88,
      currencies: ["ETH", "USDC"]
    },
    {
      title: "Regulatory Framework for Cryptocurrencies Proposed in Major Economy",
      source: "CryptoRegulation",
      publishedAt: "2024-01-15T06:30:00Z",
      summary: "Government officials have introduced comprehensive cryptocurrency regulations aimed at protecting investors while fostering innovation in the digital asset space.",
      url: "https://example.com/regulation",
      sentiment: 65,
      currencies: ["BTC", "ETH"]
    }
  ];
}

/**
 * Summarize news headlines using DeepSeek API
 * @param {Array} newsArticles - Array of news articles
 * @returns {string} Summarized news
 */
async function summarizeNews(newsArticles) {
  try {
    // Prepare the news content for summarization with enhanced information
    const newsContent = newsArticles.map((article, index) => {
      const currencyInfo = article.currencies && article.currencies.length > 0 
        ? `[${article.currencies.join(', ')}]` 
        : '';
      const sentimentInfo = article.sentiment ? `(Sentiment: ${article.sentiment})` : '';
      
      return `${index + 1}. ${article.title} ${currencyInfo} ${sentimentInfo}
   Source: ${article.source}
   Summary: ${article.summary}
   URL: ${article.url}`;
    }).join('\n\n');

    const prompt = `Please provide a comprehensive summary of the following cryptocurrency news headlines. Focus on the key trends, market movements, and significant developments. Format the summary in a clear, professional manner:

${newsContent}

Please provide:
1. A brief overview of the main themes and cryptocurrencies mentioned
2. Key market developments and their potential impact
3. Notable trends or patterns in the news
4. Sentiment analysis and market implications
5. Specific cryptocurrencies that are trending or facing challenges`;

    // Use OpenRouter API for DeepSeek
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'HTTP-Referer': 'https://crypto-news-agent.com',
        'X-Title': 'Crypto News Agent'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency news analyst. Provide clear, concise, and professional summaries of crypto news. Pay attention to specific cryptocurrencies mentioned and market sentiment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error Details:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error summarizing news:', error.message);
    throw error;
  }
}

/**
 * Send message to Telegram chat
 * @param {string} message - Message to send
 * @param {string} botToken - Telegram bot token
 * @param {string} chatId - Telegram chat ID
 */
async function sendToTelegram(message, botToken, chatId) {
  try {
    const bot = new TelegramBot(botToken, { polling: false });
    
    // Split message if it's too long (Telegram has a 4096 character limit)
    const maxLength = 4000; // Leave some buffer
    if (message.length > maxLength) {
      const parts = [];
      for (let i = 0; i < message.length; i += maxLength) {
        parts.push(message.slice(i, i + maxLength));
      }
      
      for (let i = 0; i < parts.length; i++) {
        const partMessage = i === 0 ? parts[i] : `(Part ${i + 1}/${parts.length})\n\n${parts[i]}`;
        await bot.sendMessage(chatId, partMessage, { parse_mode: 'Markdown' });
        // Add delay between messages to avoid rate limiting
        if (i < parts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } else {
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    
    console.log('✅ Message sent to Telegram successfully!');
  } catch (error) {
    console.error('❌ Error sending message to Telegram:', error.message);
    throw error;
  }
}

/**
 * Main function to orchestrate the news fetching and summarization
 */
async function main() {
  try {
    console.log('🚀 Starting Crypto News Summarization...\n');
    
    // Check if API key is configured
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY (OpenRouter) is not set in environment variables. Please check your .env file.');
    }

    // Fetch crypto news
    console.log('📰 Fetching latest crypto news headlines...');
    const newsArticles = await fetchCryptoNews();
    console.log(`✅ Fetched ${newsArticles.length} news articles\n`);

    // Display raw headlines with enhanced information
    console.log('📋 Raw News Headlines:');
    newsArticles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Source: ${article.source}`);
      console.log(`   Published: ${new Date(article.publishedAt).toLocaleString()}`);
      if (article.currencies && article.currencies.length > 0) {
        console.log(`   Currencies: ${article.currencies.join(', ')}`);
      }
      if (article.sentiment) {
        console.log(`   Sentiment Score: ${article.sentiment}`);
      }
      console.log(`   URL: ${article.url}`);
      console.log('');
    });

    // Summarize news using DeepSeek
    console.log('🤖 Generating AI-powered summary...');
    const summary = await summarizeNews(newsArticles);
    
    console.log('\n📊 AI-GENERATED SUMMARY:');
    console.log('=' .repeat(50));
    console.log(summary);
    console.log('=' .repeat(50));
    
    // Send to Telegram if configured
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (botToken && chatId) {
      console.log('\n📱 Sending summary to Telegram...');
      
      // Create a formatted message for Telegram
      const telegramMessage = `🤖 *Crypto News Summary*\n\n📰 *Latest Crypto News Headlines:*\n\n${newsArticles.map((article, index) => 
        `${index + 1}. *${article.title}*\n   📅 ${new Date(article.publishedAt).toLocaleString()}\n   🔗 [Read More](${article.url})`
      ).join('\n\n')}\n\n📊 *AI-Generated Summary:*\n\n${summary}`;
      
      await sendToTelegram(telegramMessage, botToken, chatId);
    } else {
      console.log('\n⚠️  Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable Telegram notifications.');
    }
    
    console.log('\n✅ News summarization completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Scheduled task function that runs the crypto news summarization
 */
async function runCryptoNewsTask() {
  console.log('\n🕐 Scheduled task triggered at:', new Date().toLocaleString());
  console.log('=' .repeat(60));
  
  try {
    await main();
  } catch (error) {
    console.error('❌ Error in scheduled task:', error.message);
  }
  
  console.log('=' .repeat(60));
  console.log('✅ Scheduled task completed at:', new Date().toLocaleString());
}

/**
 * Initialize the cron job and run initial task
 */
function initializeCronJob() {
  console.log('🚀 Initializing Crypto News Agent with Cron Job...');
  console.log('📅 Scheduled to run every 30 minutes');
  console.log('⏰ Current time:', new Date().toLocaleString());
  
  // Schedule the task to run every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    runCryptoNewsTask();
  }, {
    scheduled: true,
    timezone: 'UTC'
  });
  
  console.log('✅ Cron job scheduled successfully!');
  console.log('🔄 Running initial task for testing...\n');
  
  // Run the task immediately for testing
  runCryptoNewsTask();
}

// Initialize the cron job and run initial task
initializeCronJob(); 