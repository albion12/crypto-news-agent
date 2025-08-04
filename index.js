import dotenv from 'dotenv';
import fetch from 'node-fetch';
import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

// API configurations
const CRYPTOPANIC_BASE_URL = 'https://cryptopanic.com/api/developer/v2';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Predefined list of common tokens to detect
const COMMON_TOKENS = [
  'BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'XRP', 'DOT', 'LINK', 'LTC', 'BCH',
  'XLM', 'VET', 'TRX', 'FIL', 'UNI', 'ATOM', 'NEO', 'CAKE', 'AVAX', 'ALGO',
  'MATIC', 'FTM', 'SAND', 'MANA', 'SHIB', 'LUNC', 'BUSD', 'USDC', 'USDT', 'DAI',
  'WBTC', 'WETH', 'AAVE', 'COMP', 'MKR', 'SNX', 'CRV', 'YFI', 'SUSHI', '1INCH',
  'BAL', 'REN', 'BAND', 'ZRX', 'BAT', 'ENJ', 'CHZ', 'HOT', 'WIN', 'TRX',
  'ONT', 'ICX', 'ZIL', 'VET', 'THETA', 'TFUEL', 'HBAR', 'ONE', 'HARMONY', 'ZEN',
  'QTUM', 'IOTA', 'NANO', 'XMR', 'DASH', 'ZEC', 'RVN', 'GRT', 'OCEAN', 'RLC',
  'ANKR', 'COTI', 'CELO', 'KAVA', 'ZEN', 'RSR', 'STORJ', 'SKL', 'NU', 'API3',
  'PERP', 'RAD', 'BADGER', 'FARM', 'PICKLE', 'CREAM', 'ALPHA', 'BETA', 'GAMMA',
  'DELTA', 'EPSILON', 'ZETA', 'ETA', 'THETA', 'IOTA', 'KAPPA', 'LAMBDA', 'MU'
];

/**
 * Detect trending tokens from news content
 * @param {Array} newsArticles - Array of news articles
 * @returns {Array} Array of trending token symbols
 */
function detectTrendingTokens(newsArticles) {
  const tokenCounts = {};
  const allText = newsArticles.map(article => 
    `${article.title} ${article.summary}`
  ).join(' ').toUpperCase();
  
  // Count mentions of each token
  COMMON_TOKENS.forEach(token => {
    const regex = new RegExp(`\\b${token}\\b`, 'gi');
    const matches = allText.match(regex);
    if (matches) {
      tokenCounts[token] = matches.length;
    }
  });
  
  // Sort by mention count and return top 5
  const sortedTokens = Object.entries(tokenCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([token]) => token);
  
  return sortedTokens;
}

/**
 * Fetch price data for trending tokens from CoinGecko API
 * @param {Array} tokenSymbols - Array of token symbols
 * @returns {Array} Array of price data objects
 */
async function fetchTokenPrices(tokenSymbols) {
  try {
    if (tokenSymbols.length === 0) return [];
    
    // Convert symbols to CoinGecko IDs (simplified mapping)
    const symbolToId = {
      'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'DOGE': 'dogecoin',
      'ADA': 'cardano', 'XRP': 'ripple', 'DOT': 'polkadot', 'LINK': 'chainlink',
      'LTC': 'litecoin', 'BCH': 'bitcoin-cash', 'XLM': 'stellar', 'VET': 'vechain',
      'TRX': 'tron', 'FIL': 'filecoin', 'UNI': 'uniswap', 'ATOM': 'cosmos',
      'NEO': 'neo', 'CAKE': 'pancakeswap-token', 'AVAX': 'avalanche-2',
      'ALGO': 'algorand', 'MATIC': 'matic-network', 'FTM': 'fantom',
      'SAND': 'the-sandbox', 'MANA': 'decentraland', 'SHIB': 'shiba-inu',
      'LUNC': 'terra-luna', 'BUSD': 'binance-usd', 'USDC': 'usd-coin',
      'USDT': 'tether', 'DAI': 'dai', 'WBTC': 'wrapped-bitcoin',
      'WETH': 'weth', 'AAVE': 'aave', 'COMP': 'compound-governance-token',
      'MKR': 'maker', 'SNX': 'havven', 'CRV': 'curve-dao-token',
      'YFI': 'yearn-finance', 'SUSHI': 'sushi', '1INCH': '1inch',
      'BAL': 'balancer', 'REN': 'republic-protocol', 'BAND': 'band-protocol',
      'ZRX': '0x', 'BAT': 'basic-attention-token', 'ENJ': 'enjincoin',
      'CHZ': 'chiliz', 'HOT': 'holochain', 'WIN': 'wink', 'ONT': 'ontology',
      'ICX': 'icon', 'ZIL': 'zilliqa', 'THETA': 'theta-token', 'TFUEL': 'theta-fuel',
      'HBAR': 'hedera-hashgraph', 'ONE': 'harmony', 'HARMONY': 'harmony',
      'ZEN': 'horizen', 'QTUM': 'qtum', 'IOTA': 'iota', 'NANO': 'nano',
      'XMR': 'monero', 'DASH': 'dash', 'ZEC': 'zcash', 'RVN': 'ravencoin',
      'GRT': 'the-graph', 'OCEAN': 'ocean-protocol', 'RLC': 'iexec-rlc',
      'ANKR': 'ankr', 'COTI': 'coti', 'CELO': 'celo', 'KAVA': 'kava',
      'RSR': 'reserve-rights-token', 'STORJ': 'storj', 'SKL': 'skale',
      'NU': 'nucypher', 'API3': 'api3', 'PERP': 'perpetual-protocol',
      'RAD': 'radicle', 'BADGER': 'badger-dao', 'FARM': 'harvest-finance',
      'PICKLE': 'pickle-finance', 'CREAM': 'cream-2', 'ALPHA': 'alpha-finance',
      'BETA': 'beta-finance', 'GAMMA': 'gamma-strategies', 'DELTA': 'delta-exchange-token',
      'EPSILON': 'epsilon', 'ZETA': 'zeta', 'ETA': 'eta', 'THETA': 'theta-token',
      'IOTA': 'iota', 'KAPPA': 'kappa', 'LAMBDA': 'lambda', 'MU': 'mu'
    };
    
    const coinIds = tokenSymbols
      .map(symbol => symbolToId[symbol])
      .filter(id => id); // Remove undefined mappings
    
    if (coinIds.length === 0) return [];
    
    const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`;
    
    console.log('💰 Fetching price data from CoinGecko...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Map the data back to symbols
    const priceData = tokenSymbols.map(symbol => {
      const coinId = symbolToId[symbol];
      const coinData = data.find(coin => coin.id === coinId);
      
      if (coinData) {
        return {
          symbol: symbol,
          price: coinData.current_price,
          priceChange24h: coinData.price_change_percentage_24h,
          marketCap: coinData.market_cap
        };
      }
      
      return {
        symbol: symbol,
        price: null,
        priceChange24h: null,
        marketCap: null
      };
    });
    
    return priceData;
    
  } catch (error) {
    console.error('Error fetching token prices:', error.message);
    return [];
  }
}

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
    
    // Detect trending tokens
    console.log('\n🔍 Detecting trending tokens...');
    const trendingTokens = detectTrendingTokens(newsArticles);
    console.log(`🔥 Trending: ${trendingTokens.join(', ')}`);
    
    // Fetch price data for trending tokens
    let priceSummary = '';
    if (trendingTokens.length > 0) {
      const priceData = await fetchTokenPrices(trendingTokens);
      
      if (priceData.length > 0) {
        console.log('\n💰 Price Impact Summary:');
        priceSummary = '\n\n💰 *Price Impact Summary:*\n';
        
        priceData.forEach(token => {
          if (token.price !== null && token.priceChange24h !== null) {
            const arrow = token.priceChange24h >= 0 ? '📈' : '📉';
            const changeText = token.priceChange24h >= 0 ? 'up' : 'down';
            const absChange = Math.abs(token.priceChange24h);
            
            console.log(`${arrow} ${token.symbol}: $${token.price.toFixed(2)} (${changeText} ${absChange.toFixed(1)}% in 24h)`);
            priceSummary += `${arrow} *${token.symbol}*: $${token.price.toFixed(2)} (${changeText} ${absChange.toFixed(1)}% in 24h)\n`;
          }
        });
      }
    }
    
    // Send to Telegram if configured
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (botToken && chatId) {
      console.log('\n📱 Sending summary to Telegram...');
      
      // Create a formatted message for Telegram
      const telegramMessage = `🤖 *Crypto News Summary*\n\n📰 *Latest Crypto News Headlines:*\n\n${newsArticles.map((article, index) => 
        `${index + 1}. *${article.title}*\n   📅 ${new Date(article.publishedAt).toLocaleString()}\n   🔗 [Read More](${article.url})`
      ).join('\n\n')}\n\n📊 *AI-Generated Summary:*\n\n${summary}\n\n🔥 *Trending Tokens:* ${trendingTokens.join(', ')}${priceSummary}`;
      
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
  console.log('📅 Scheduled to run every 2 minutes');
  console.log('⏰ Current time:', new Date().toLocaleString());
  
  // Schedule the task to run every 2 minutes
  cron.schedule('*/2 * * * *', () => {
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