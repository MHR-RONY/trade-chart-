
const menuToggle = document.getElementById('menuToggle');
const mobileSidebar = document.getElementById('mobileSidebar');
const overlay = document.getElementById('overlay');
const exchangeTitle = document.getElementById('exchangeTitle');
const cryptoListContent = document.getElementById('cryptoListContent');
const tradingChart = document.getElementById('tradingChart');
const exchangeBtns = document.querySelectorAll('.exchange-btn');
const intervalBtns = document.querySelectorAll('.interval-btn');

// State
let activeExchange = 'binance';
let selectedInterval = 5000; // Default to 5 seconds
let cryptos = [];
let previousPrices = {};
let priceDirections = {};
let candleData = []; // Changed from chartData to candleData
let updateIntervalId = null;
let animationFrameId = null;

// Chart Colors
const chartColors = {
	background: '#131722',
	grid: '#1c2030', 
	text: '#D9D9D9',
	bullish: '#26a69a', // Vibrant teal for bullish candles
	bearish: '#ef5350', // Vibrant red for bearish candles
	wickBullish: '#4CAF50', // Slightly different green for wicks
	wickBearish: '#FF5252', // Slightly different red for wicks
	volumeBullish: 'rgba(38, 166, 154, 0.5)',
	volumeBearish: 'rgba(239, 83, 80, 0.5)',
	highlight: '#FFD700', // Gold for highlights
	axisLabel: '#9CA3AF',
	priceLabel: '#F0F0F0',
	priceLabelBg: 'rgba(0, 0, 0, 0.7)',
	currentPriceBox: '#ff4d5b' // Red box for current price like in the image
};

// Mobile Menu Toggle
menuToggle.addEventListener('click', () => {
	mobileSidebar.classList.toggle('active');
	overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
	mobileSidebar.classList.remove('active');
	overlay.classList.remove('active');
});

// Exchange Button Click Handlers
exchangeBtns.forEach(btn => {
	btn.addEventListener('click', () => {
		// Update active exchange
		activeExchange = btn.getAttribute('data-exchange');

		// Update UI
		exchangeBtns.forEach(b => b.classList.remove('active'));
		document.querySelectorAll(`[data-exchange="${activeExchange}"]`).forEach(b => b.classList.add('active'));

		// Update exchange title
		exchangeTitle.textContent = activeExchange.charAt(0).toUpperCase() + activeExchange.slice(1);

		// Close mobile sidebar if open
		mobileSidebar.classList.remove('active');
		overlay.classList.remove('active');

		// Reset crypto data for new exchange
		initializeCryptoData();
	});
});

// Interval Button Click Handlers
intervalBtns.forEach(btn => {
	btn.addEventListener('click', () => {
		// Update selected interval
		selectedInterval = parseInt(btn.getAttribute('data-interval'));

		// Update UI
		intervalBtns.forEach(b => b.classList.remove('active'));
		btn.classList.add('active');

		// Reset update interval
		setupUpdateInterval();
	});
});

// Initialize Crypto Data
function initializeCryptoData() {
	// Initial crypto data
	cryptos = [
		{
			symbol: 'BTC/USDT',
			name: 'Bitcoin',
			price: 93448.00,
			priceChange24h: 9.19,
			icon: { type: 'fa', class: 'fa-brands fa-bitcoin', color: '#f7931a' }
		},
		{
			symbol: 'ETH/USDT',
			name: 'Ethereum',
			price: 2379.46,
			priceChange24h: 7.63,
			icon: { type: 'fa', class: 'fa-brands fa-ethereum', color: '#627eea' }
		},
		{
			symbol: 'BNB/USDT',
			name: 'Binance Coin',
			price: 607.36,
			priceChange24h: 0.28,
			icon: { type: 'letter', letter: 'B', color: '#f3ba2f' }
		},
		{
			symbol: 'SOL/USDT',
			name: 'Solana',
			price: 165.99,
			priceChange24h: 17.36,
			icon: { type: 'letter', letter: 'S', color: '#00ffbd' }
		},
		{
			symbol: 'XRP/USDT',
			name: 'Ripple',
			price: 2.69,
			priceChange24h: 19.67,
			icon: { type: 'letter', letter: 'X', color: '#23292f' }
		},
		{
			symbol: 'ADA/USDT',
			name: 'Cardano',
			price: 1.01,
			priceChange24h: 34.43,
			icon: { type: 'letter', letter: 'A', color: '#0033ad' }
		},
		{
			symbol: 'DOGE/USDT',
			name: 'Dogecoin',
			price: 0.22,
			priceChange24h: 9.26,
			icon: { type: 'letter', letter: 'D', color: '#c3a634' }
		},
		{
			symbol: 'DOT/USDT',
			name: 'Polkadot',
			price: 5.00,
			priceChange24h: 8.64,
			icon: { type: 'letter', letter: 'D', color: '#e6007a' }
		},
		{
			symbol: 'AVAX/USDT',
			name: 'Avalanche',
			price: 23.89,
			priceChange24h: 9.20,
			icon: { type: 'letter', letter: 'A', color: '#e84142' }
		},
		{
			symbol: 'TORN/USDT',
			name: 'Tornado Cash',
			price: 7.03,
			priceChange24h: -1.40,
			icon: { type: 'letter', letter: 'T', color: '#777777' }
		}
	];

	// Create initial previous prices object
	previousPrices = {};
	cryptos.forEach(crypto => {
		previousPrices[crypto.symbol] = crypto.price;
	});

	// Render initial crypto list
	renderCryptoList();

	// Setup update interval
	setupUpdateInterval();

	// Initialize chart data
	initializeCandleData();
}

// Render Crypto List
function renderCryptoList() {
	cryptoListContent.innerHTML = '';

	cryptos.forEach(crypto => {
		const cryptoItem = document.createElement('div');
		cryptoItem.className = `crypto-item ${priceDirections[crypto.symbol] || ''}`;
		cryptoItem.setAttribute('data-symbol', crypto.symbol);

		// Create icon
		let iconHtml = '';
		if (crypto.icon.type === 'fa') {
			iconHtml = `<i class="${crypto.icon.class}" style="color: ${crypto.icon.color}"></i>`;
		} else {
			iconHtml = `<div class="crypto-icon" style="background-color: ${crypto.icon.color}">${crypto.icon.letter}</div>`;
		}

		// Format price
		const formattedPrice = crypto.price < 1
			? crypto.price.toFixed(4)
			: crypto.price.toFixed(2);

		// Format change
		const changeClass = crypto.priceChange24h >= 0 ? 'change-up' : 'change-down';
		const changePrefix = crypto.priceChange24h >= 0 ? '+' : '';

		cryptoItem.innerHTML = `
      <div class="crypto-name">
        ${iconHtml}
        <div class="crypto-symbol">${crypto.symbol}</div>
      </div>
      <div class="crypto-price">${formattedPrice}</div>
      <div class="crypto-change">
        <span class="change-badge ${changeClass}">
          ${changePrefix}${crypto.priceChange24h.toFixed(2)}%
        </span>
      </div>
    `;

		cryptoListContent.appendChild(cryptoItem);
	});
}

// Update Crypto Prices
function updateCryptoPrices() {
	cryptos = cryptos.map(crypto => {
		// Generate new price with small random change
		const changePercent = (Math.random() * 0.01) - 0.005; // -0.5% to +0.5%
		const newPrice = crypto.price * (1 + changePercent);

		// Determine price direction
		const direction = newPrice > previousPrices[crypto.symbol] ? 'price-up' :
			newPrice < previousPrices[crypto.symbol] ? 'price-down' : '';

		// Update price directions
		priceDirections[crypto.symbol] = direction;

		// Update previous price
		previousPrices[crypto.symbol] = newPrice;

		// Generate random 24h change
		const newPriceChange = (Math.random() * 20 - 5);

		return {
			...crypto,
			price: newPrice,
			priceChange24h: newPriceChange
		};
	});

	// Update UI
	renderCryptoList();
}

// Setup Update Interval
function setupUpdateInterval() {
	// Clear existing interval
	if (updateIntervalId) {
		clearInterval(updateIntervalId);
	}

	// Set new interval
	updateIntervalId = setInterval(() => {
		updateCryptoPrices();
		updateCandleData();
	}, selectedInterval);
}

// Generate a random candle
function generateCandle(prevClose) {
	const volatility = prevClose * 0.01; // 1% volatility
	const open = prevClose + (Math.random() - 0.5) * volatility;
	const close = open + (Math.random() - 0.5) * volatility;
	const high = Math.max(open, close) + Math.random() * volatility * 0.5;
	const low = Math.min(open, close) - Math.random() * volatility * 0.5;
	const volume = Math.random() * 1000 + 500; // Random volume between 500 and 1500

	return {
		open,
		high,
		low,
		close,
		volume,
		timestamp: new Date().getTime()
	};
}

// Initialize Candle Data
function initializeCandleData() {
	candleData = [];
	let basePrice = 93448; // Starting price for BTC

	// Generate historical candles
	for (let i = 0; i < 50; i++) {
		const candle = generateCandle(basePrice);
		candleData.push(candle);
		basePrice = candle.close; // Use previous close as the base for next candle
	}

	// Initialize chart
	initializeChart();
}

// Update Candle Data
function updateCandleData() {
	if (candleData.length > 0) {
		const lastCandle = candleData[candleData.length - 1];
		const newCandle = generateCandle(lastCandle.close);
		candleData.push(newCandle);

		// Keep only the last 50 candles
		if (candleData.length > 50) {
			candleData.shift();
		}
	}
}

// Initialize Chart
function initializeChart() {
	const ctx = tradingChart.getContext('2d');

	// Set canvas dimensions
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);

	// Start animation loop
	animateChart();
}

// Resize Canvas
function resizeCanvas() {
	const container = tradingChart.parentElement;
	if (container) {
		tradingChart.width = container.clientWidth;
		tradingChart.height = 400;
	}
}

// Draw price label with background
function drawPriceLabel(ctx, text, x, y, align = 'left', isCurrentPrice = false) {
	const metrics = ctx.measureText(text);
	const textWidth = metrics.width;
	const padding = 6;
	const height = 20;

	// Draw background
	ctx.fillStyle = isCurrentPrice ? chartColors.currentPriceBox : chartColors.priceLabelBg;

	if (align === 'right') {
		ctx.fillRect(x - textWidth - padding * 2, y - height + 4, textWidth + padding * 2, height);
	} else {
		ctx.fillRect(x, y - height + 4, textWidth + padding * 2, height);
	}

	// Draw text
	ctx.fillStyle = chartColors.priceLabel;
	ctx.fillText(text, align === 'right' ? x - textWidth - padding : x + padding, y);
}

// Format time for display
function formatTime(timestamp) {
	const date = new Date(timestamp);
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
}

// Animate Chart
function animateChart() {
	const ctx = tradingChart.getContext('2d');

	// Clear canvas
	ctx.clearRect(0, 0, tradingChart.width, tradingChart.height);

	// Set background
	ctx.fillStyle = chartColors.background;
	ctx.fillRect(0, 0, tradingChart.width, tradingChart.height);

	// Find min and max for scaling
	const prices = candleData.flatMap(candle => [candle.high, candle.low]);
	const min = Math.min(...prices) * 0.999;
	const max = Math.max(...prices) * 1.001;
	const range = max - min;

	// Calculate chart area dimensions
	const chartTop = 40;
	const chartBottom = tradingChart.height - 60; // Leave space for volume
	const chartHeight = chartBottom - chartTop;

	// Draw grid
	ctx.strokeStyle = chartColors.grid;
	ctx.lineWidth = 0.5;

	// Horizontal grid lines
	for (let i = 0; i <= 4; i++) {
		const y = chartTop + i * (chartHeight / 4);
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(tradingChart.width, y);
		ctx.stroke();

		// Price labels
		const price = max - (i * (range / 4));
		ctx.fillStyle = chartColors.axisLabel;
		ctx.font = '10px Arial';
		drawPriceLabel(ctx, price.toFixed(2), tradingChart.width - 70, y + 4, 'right');
	}

	// Vertical grid lines
	const numVerticalLines = 10;
	for (let i = 0; i <= numVerticalLines; i++) {
		const x = i * (tradingChart.width / numVerticalLines);
		ctx.beginPath();
		ctx.moveTo(x, chartTop);
		ctx.lineTo(x, chartBottom);
		ctx.stroke();

		// Time labels (simplified)
		if (i % 2 === 0 && i < numVerticalLines) {
			const timeLabel = `${i * 5}m`;
			ctx.fillStyle = chartColors.axisLabel;
			ctx.font = '10px Arial';
			ctx.fillText(timeLabel, x + 5, chartBottom + 15);
		}
	}

	// Find max volume for scaling
	const maxVolume = Math.max(...candleData.map(candle => candle.volume));

	// Draw candles
	const candleWidth = tradingChart.width / candleData.length * 0.8;
	const spacing = tradingChart.width / candleData.length * 0.2;

	candleData.forEach((candle, index) => {
		const x = index * (candleWidth + spacing) + spacing / 2;

		// Calculate y coordinates for price
		const openY = chartTop + ((max - candle.open) / range) * chartHeight;
		const closeY = chartTop + ((max - candle.close) / range) * chartHeight;
		const highY = chartTop + ((max - candle.high) / range) * chartHeight;
		const lowY = chartTop + ((max - candle.low) / range) * chartHeight;

		const isBullish = candle.close >= candle.open;

		// Draw volume bars
		const volumeHeight = (candle.volume / maxVolume) * 50; // Max height of 50px for volume
		const volumeY = chartBottom;

		ctx.fillStyle = isBullish ? chartColors.volumeBullish : chartColors.volumeBearish;
		ctx.fillRect(x, volumeY, candleWidth, volumeHeight);

		// Draw wick (high to low line)
		ctx.beginPath();
		ctx.moveTo(x + candleWidth / 2, highY);
		ctx.lineTo(x + candleWidth / 2, lowY);
		ctx.strokeStyle = isBullish ? chartColors.wickBullish : chartColors.wickBearish;
		ctx.lineWidth = 1.5;
		ctx.stroke();

		// Draw candle body
		ctx.fillStyle = isBullish ? chartColors.bullish : chartColors.bearish;
		const bodyHeight = Math.abs(closeY - openY);
		const bodyY = Math.min(openY, closeY);

		ctx.fillRect(x, bodyY, candleWidth, Math.max(bodyHeight, 1)); // Ensure minimum height of 1px

		// Draw border around candle body
		ctx.strokeStyle = isBullish ? chartColors.wickBullish : chartColors.wickBearish;
		ctx.lineWidth = 1;
		ctx.strokeRect(x, bodyY, candleWidth, Math.max(bodyHeight, 1));
	});

	// Draw chart border
	ctx.strokeStyle = chartColors.grid;
	ctx.lineWidth = 1;
	ctx.strokeRect(0, chartTop, tradingChart.width, chartHeight);

	// Display current price with highlight
	const currentCandle = candleData[candleData.length - 1];
	const currentPrice = currentCandle.close;
	const currentPriceY = chartTop + ((max - currentPrice) / range) * chartHeight;

	// Draw price line
	ctx.beginPath();
	ctx.moveTo(0, currentPriceY);
	ctx.lineTo(tradingChart.width, currentPriceY);
	ctx.strokeStyle = chartColors.highlight;
	ctx.lineWidth = 1;
	ctx.setLineDash([5, 3]);
	ctx.stroke();
	ctx.setLineDash([]);

	// Draw current price label
	ctx.fillStyle = chartColors.highlight;
	ctx.font = 'bold 12px Arial';
	drawPriceLabel(ctx, `$${currentPrice.toFixed(2)}`, 5, currentPriceY - 5);

	// Display title and info
	ctx.fillStyle = chartColors.text;
	ctx.font = 'bold 16px Arial';
	ctx.fillText(`BTC/USDT`, 10, 25);

	// Display current price box in top right (like in the image)
	const now = new Date();
	const timeString = formatTime(now);
	ctx.font = 'bold 14px Arial';

	// Draw price box like in the image
	const priceText = `${currentPrice.toFixed(2)}`;
	const timeText = `${timeString}`;
	const boxWidth = 120;
	const boxHeight = 50;
	const boxX = tradingChart.width - boxWidth - 10;
	const boxY = 10;

	// Draw box
	ctx.fillStyle = chartColors.currentPriceBox;
	ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

	// Draw price and time
	ctx.fillStyle = '#FFFFFF';
	ctx.font = 'bold 16px Arial';
	ctx.fillText(priceText, boxX + 10, boxY + 20);
	ctx.font = '12px Arial';
	ctx.fillText(timeText, boxX + 10, boxY + 40);

	// Display update interval
	const intervalText = (selectedInterval / 1000) + 's';
	ctx.fillStyle = chartColors.axisLabel;
	ctx.font = '12px Arial';
	ctx.fillText(`Update: ${intervalText}`, 10, tradingChart.height - 10);

	// Continue animation
	animationFrameId = requestAnimationFrame(animateChart);
}

// Initialize the app
function initApp() {
	initializeCryptoData();
}

// Start the app
initApp();