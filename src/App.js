// src/App.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";
import "./budget-form-2x2.css";
import "./budget-fadein.css";
import "./InfoPage.horizontal.css";
import "./comparison-horizontal.css";
import GeminiChat from "./GeminiChat"; // ← Our new Gemini chat component
import WelcomePage from "./WelcomePage";

/* 
  Helper: Compound‐Interest Calculation
  P: principal (number), r: annual rate (number), t: years (number), 
  n: compoundings per year (number), C: monthly contribution (number)
*/
const calculateCompoundInterest = (P, r, t, n, C) => {
  let data = [];
  for (let i = 0; i <= t; i += 0.1) {
    const principalGrowth = P * Math.pow(1 + r / n, n * i);
    const contributionsGrowth =
      C * ((Math.pow(1 + r / 12, 12 * i) - 1) / (r / 12));
    data.push({ x: i, y: principalGrowth + contributionsGrowth });
  }
  return data;
};

/* 
  1) CompoundInterestGraph Component (SVG Graph)
     Includes monthly contributions in the calculation.
*/
const CompoundInterestGraph = ({
  principalStr,
  rateStr,
  yearsStr,
  compoundingsStr,
  monthlyContributionStr,
  title,
}) => {
  // Convert strings → numbers (default to 0 if parse fails)
  const P = Number(principalStr) || 0;
  const r = Number(rateStr) || 0;
  const t = Number(yearsStr) || 0;
  const n = Number(compoundingsStr) || 1;
  const C = Number(monthlyContributionStr) || 0;

  const graphData = calculateCompoundInterest(P, r, t, n, C);
  const xMax = t;
  const yMax = graphData.reduce((max, point) => (point.y > max ? point.y : max), 0);
  const finalAmount = graphData[graphData.length - 1]?.y.toFixed(2) || "0.00";

  return (
    <div className="graph-container card">
      <h3 className="graph-title">{title}</h3>
      <svg width="700" height="350" viewBox="-50 -50 600 400">
        {/* Vertical grid lines */}
        {[...Array(6)].map((_, i) => (
          <g key={`v-${i}`}>
            <line x1={i * 100} y1="0" x2={i * 100} y2="300" stroke="#ddd" />
            <text x={i * 100} y="320" fontSize="12" textAnchor="middle">
              {Math.round((i / 5) * xMax)}
            </text>
          </g>
        ))}
        {/* Horizontal grid lines */}
        {[...Array(6)].map((_, i) => (
          <g key={`h-${i}`}>
            <line x1="0" y1={i * 50} x2="500" y2={i * 50} stroke="#ddd" />
            <text x="-20" y={300 - i * 50} fontSize="12" textAnchor="end">
              {Math.round((i / 5) * yMax)}
            </text>
          </g>
        ))}
        {/* Axes */}
        <line x1="0" y1="300" x2="500" y2="300" stroke="#333" strokeWidth="2" />
        <line x1="0" y1="0" x2="0" y2="300" stroke="#333" strokeWidth="2" />
        {/* Axis labels */}
        <text x="250" y="350" fontSize="14" textAnchor="middle">
          Years Invested
        </text>
        <text
          x="-70"
          y="100"
          fontSize="14"
          textAnchor="middle"
          transform="rotate(-90,-50,125)"
        >
          Total Savings ($)
        </text>
        <polyline
          fill="none"
          stroke="#FF5733"
          strokeWidth="3"
          points={graphData
            .map(({ x, y }) => `${(x / xMax) * 500},${300 - (y / yMax) * 300}`)
            .join(" ")}
        />
      </svg>
      <p className="final-amount">Final Savings: ${finalAmount}</p>
    </div>
  );
};

/* 
  2) DesmosGraph Component
     Collapsed expressions, includes monthly contributions.
*/
const DesmosGraph = ({
  principalStr,
  rateStr,
  yearsStr,
  compoundingsStr,
  monthlyContributionStr,
  title,
}) => {
  const calculatorRef = useRef(null);
  const calculator = useRef(null);
  const [showPopup, setShowPopup] = useState(false);

  // Convert strings → numbers
  const P = Number(principalStr) || 0;
  const r = Number(rateStr) || 0;
  const t = Number(yearsStr) || 0;
  const n = Number(compoundingsStr) || 1;
  const C = Number(monthlyContributionStr) || 0;

  useEffect(() => {
    if (!calculator.current && window.Desmos) {
      calculator.current = window.Desmos.GraphingCalculator(calculatorRef.current, {
        expressions: true,
        expressionsCollapsed: true,
        settingsMenu: false,
      });
      calculator.current.updateSettings({ expressionsCollapsed: true });
    }

    if (calculator.current) {
      const expression = `A(t)=${P}\\left(1+\\frac{${r}}{${n}}\\right)^{${n}t}+${C}\\left(\\frac{\\left(1+\\frac{${r}}{12}\\right)^{12t}-1}{${r}/12}\\right)`;
      calculator.current.setExpression({ id: "compound", latex: expression });

      const principalGrowth = P * Math.pow(1 + r / n, n * t);
      const contributionsGrowth =
        C * ((Math.pow(1 + r / 12, 12 * t) - 1) / (r / 12));
      const finalAmount = principalGrowth + contributionsGrowth;

      calculator.current.setMathBounds({
        left: 0,
        right: t <= 0 ? 10 : t,
        bottom: 0,
        top: finalAmount > 0 ? finalAmount * 1.1 : 1000,
      });
    }
  }, [P, r, t, n, C]);

  return (
    <div className="desmos-container card" style={{ marginTop: "30px", position: "relative" }}>
      {title && <h3 className="graph-title">{title}</h3>}
      <div className="desmos-info-icon" onClick={() => setShowPopup(true)} title="How to use the graph">
        ?
      </div>
      <div ref={calculatorRef} style={{ width: "900px", height: "450px", margin: "0 auto" }} />
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h4>How to Use the Graph</h4>
            <p>
              Drag your cursor over the graph to see the coordinates. The <strong>x-coordinate</strong> represents the time (in years) since you started investing, and the <strong>y-coordinate</strong> shows your total savings.
            </p>
            <button className="close-button" onClick={() => setShowPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* 
  3) YearlyBreakdown Component 
     A table with the balance at the end of each year.
*/
const YearlyBreakdown = ({
  principalStr,
  rateStr,
  yearsStr,
  compoundingsStr,
  monthlyContributionStr,
}) => {
  const P = Number(principalStr) || 0;
  const r = Number(rateStr) || 0;
  const t = Number(yearsStr) || 0;
  const n = Number(compoundingsStr) || 1;
  const C = Number(monthlyContributionStr) || 0;

  const breakdown = [];
  for (let i = 0; i <= t; i++) {
    const principalGrowth = P * Math.pow(1 + r / n, n * i);
    const contributionsGrowth =
      C * ((Math.pow(1 + r / 12, 12 * i) - 1) / (r / 12));
    breakdown.push({
      year: i,
      principalGrowth,
      contributionsGrowth,
      total: principalGrowth + contributionsGrowth,
    });
  }

  return (
    <div className="yearly-breakdown card">
      <h3 className="breakdown-title">Year-by-Year Breakdown</h3>
      <table className="breakdown-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Principal Growth ($)</th>
            <th>Contributions ($)</th>
            <th>Total Savings ($)</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((item) => (
            <tr key={item.year}>
              <td>{item.year}</td>
              <td>{item.principalGrowth.toFixed(2)}</td>
              <td>{item.contributionsGrowth.toFixed(2)}</td>
              <td>{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* 
  4) InfoPage Component 
     Shows detailed info about compound interest, real-life examples, etc.,
     plus new sections for Investment Platforms and Investment Vehicles.
*/
const InfoPage = () => {
  return (
    <div className="info-page card">
      <h2 className="info-title">The Power of Investing Early</h2>
      <div className="info-container">
        <div className="info-box why-investing-matters">
  <h3 className="info-subtitle">Why Investing Matters</h3>
  <div className="why-investing-grid">
    <div className="why-investing-benefits">
      <p className="info-text">
        Investing is how you make your money work for you. The earlier you start, the more powerful your results—thanks to compounding and time.
      </p>
      <ul className="info-list">
        <li><strong>Grow Your Wealth:</strong> Build financial security and reach your goals faster.</li>
        <li><strong>Beat Inflation:</strong> Stay ahead as prices rise over time.</li>
        <li><strong>Compound Returns:</strong> Watch your earnings generate even more earnings.</li>
        <li><strong>Financial Freedom:</strong> Investing gives you more choices and a comfortable future.</li>
      </ul>
    </div>
    <div className="why-investing-tips-card">
      <h4 className="tips-title">Quick Tips</h4>
      <ul className="tips-list">
        <li><strong>Start Early:</strong> Time is your best friend.</li>
        <li><strong>Be Consistent:</strong> Invest regularly—even small amounts.</li>
        <li><strong>Diversify:</strong> Spread your money across different assets.</li>
        <li><strong>Stay Calm:</strong> Ignore short-term noise, focus on the long term.</li>
      </ul>
    </div>
  </div>
  <div className="key-takeaway-box">
    <span className="key-takeaway-label">Key Takeaway</span>
    <span className="key-takeaway-text">The sooner you invest, the greater your potential gains—thanks to the magic of compounding.</span>
  </div>
  <div className="real-life-example-callout">
    <h4 className="example-title">Real-Life Example</h4>
    <div className="example-content">
      <div className="example-avatar">
        <img src="/alice.jpeg" alt="Alice" />
        <span>Alice</span>
      </div>
      <div className="example-details">
        <p><strong>Starts at 25:</strong> Invests $200/month at 7% annual return.<br />By 65: <span className="example-amount">$528,000</span></p>
      </div>
      <div className="example-avatar">
        <img src="/bob.jpeg" alt="Bob" />
        <span>Bob</span>
      </div>
      <div className="example-details">
        <p><strong>Starts at 35:</strong> Same $200/month, same return.<br />By 65: <span className="example-amount">$245,000</span></p>
      </div>
    </div>
    <div className="example-summary">
      <span>Starting 10 years earlier more than <strong>doubles</strong> your outcome!</span>
    </div>
  </div>
</div>
        <div className="info-box">
          <h3 className="info-subtitle">Why Start Early?</h3>
          <div className="info-box-inner">
            <ul className="info-list">
              <li><strong>Exponential Growth:</strong> More time means more growth.</li>
              <li><strong>Risk Mitigation:</strong> A long-term approach smooths out volatility.</li>
              <li><strong>Compounding Magic:</strong> Earnings generate additional earnings over time.</li>
            </ul>
          </div>
        </div>
        <div className="info-box real-life-example">
          <h3 className="info-subtitle">Real-Life Example</h3>
          <div className="example-cards">
            <div className="example-card">
              <div className="image-header">Alice</div>
              <img src="/alice.jpeg" alt="Alice" className="example-card-image" />
              <p>
                Begins investing $200/month at age 25 with a 7% annual return (compounded monthly).
                By age 65, her investment grows to approximately <strong>$528,000</strong>.
              </p>
            </div>
            <div className="example-card">
              <div className="image-header">Bob</div>
              <img src="/bob.jpeg" alt="Bob" className="example-card-image" />
              <p>
                Starts at age 35 with the same $200/month contribution and 7% return.
                By age 65, his investment grows to roughly <strong>$245,000</strong>.
              </p>
            </div>
            <div className="example-card">
              <div className="image-header">Charlie</div>
              <img src="/charlie.jpeg" alt="Charlie" className="example-card-image" />
              <p>
                Begins investing $200/month at age 25 like Alice, but stops contributions at age 35.
                Despite no contributions after age 35, his investment grows to about <strong>$350,000</strong> by age 65,
                thanks to compound interest on his early contributions.
              </p>
            </div>
          </div>
          <p className="info-text">
            This example highlights not only the power of an early start but also the impact of consistency and duration on your final investment outcome.
          </p>
        </div>
        <div className="info-box">
          <h3 className="info-subtitle">Tips for Getting Started</h3>
          <div className="info-box-inner">
            <ul className="info-list">
              <li><strong>Start Small:</strong> Even modest amounts add up over time.</li>
              <li><strong>Be Consistent:</strong> Regular contributions maximize compounding benefits.</li>
              <li><strong>Diversify:</strong> Spread your investments to reduce risk.</li>
              <li><strong>Stay Patient:</strong> Think long term and avoid impulsive decisions during market downturns.</li>
            </ul>
          </div>
        </div>

        {/* NEW: Investment Platforms Section */}
        <div className="info-box deep-dive">
          <h3 className="info-subtitle">Best Investment Platforms</h3>
          <p className="info-text">
            Below are some popular online brokerage and investment platforms, with pros, cons, and links to learn more:
          </p>
          <ul className="platform-list">
            <li>
              <a href="https://www.fidelity.com" target="_blank" rel="noopener noreferrer">
                Fidelity
              </a>
              <p className="platform-pros"><strong>Pros:</strong> Comprehensive research tools, extensive mutual fund lineup, high-quality customer service.</p>
              <p className="platform-cons"><strong>Cons:</strong> Some mutual funds carry transaction fees; the interface can be overwhelming for beginners.</p>
            </li>
            <li>
              <a href="https://www.robinhood.com" target="_blank" rel="noopener noreferrer">
                Robinhood
              </a>
              <p className="platform-pros"><strong>Pros:</strong> Commission-free trades, easy mobile app, fractional shares.</p>
              <p className="platform-cons"><strong>Cons:</strong> Limited research tools, no mutual funds or bonds, occasional reliability issues.</p>
            </li>
            <li>
              <a href="https://www.tdameritrade.com" target="_blank" rel="noopener noreferrer">
                TD Ameritrade
              </a>
              <p className="platform-pros"><strong>Pros:</strong> Robust trading platform (thinkorswim), no commission on stocks/ETFs, excellent educational resources.</p>
              <p className="platform-cons"><strong>Cons:</strong> Platform may be complex for new users; some mutual funds carry fees.</p>
            </li>
            <li>
              <a href="https://www.schwab.com" target="_blank" rel="noopener noreferrer">
                Charles Schwab
              </a>
              <p className="platform-pros"><strong>Pros:</strong> No minimum account, wide range of low-cost ETFs, strong customer service.</p>
              <p className="platform-cons"><strong>Cons:</strong> Advanced tools may have a learning curve; some mutual fund expense ratios are higher.</p>
            </li>
          </ul>
        </div>

        {/* NEW: Investment Vehicles Section */}
        <div className="info-box deep-dive">
          <h3 className="info-subtitle">Key Investment Vehicles</h3>
          <div className="vehicle-section-horizontal">
            <div className="vehicle-items-grid">
              <div className="vehicle-item">
                <h4>Roth IRA</h4>
                <p className="info-text">A Roth Individual Retirement Account allows you to contribute after-tax dollars. Earnings grow tax-free, and qualified withdrawals in retirement are tax-free.</p>
                <p className="vehicle-pros"><strong>Pros:</strong> Tax-free growth, no required minimum distributions, contributions can be withdrawn penalty-free.</p>
                <p className="vehicle-cons"><strong>Cons:</strong> Income limits restrict eligibility; contributions are not tax-deductible.</p>
              </div>
              <div className="vehicle-item">
                <h4>401(k)</h4>
                <p className="info-text">A retirement savings plan sponsored by an employer. Contributions are pre-tax, reducing your taxable income. Many employers offer matching contributions.</p>
                <p className="vehicle-pros"><strong>Pros:</strong> Tax-deferred growth, employer match, higher annual contribution limits.</p>
                <p className="vehicle-cons"><strong>Cons:</strong> Early withdrawals are penalized; limited investment choices.</p>
              </div>
              <div className="vehicle-item">
                <h4>Index Fund</h4>
                <p className="info-text">A mutual fund or ETF designed to track a specific market index, such as the S&P 500. Offers instant diversification and low fees.</p>
                <p className="vehicle-pros"><strong>Pros:</strong> Low cost, broad diversification, passive management.</p>
                <p className="vehicle-cons"><strong>Cons:</strong> No chance to outperform the market; returns mirror the tracked index.</p>
              </div>
              <div className="vehicle-item">
                <h4>ETF (Exchange-Traded Fund)</h4>
                <p className="info-text">A basket of securities traded on an exchange, combining the diversification of mutual funds with the flexibility of stocks.</p>
                <p className="vehicle-pros"><strong>Pros:</strong> Traded like stocks, low expense ratios, tax efficient.</p>
                <p className="vehicle-cons"><strong>Cons:</strong> Brokerage commissions (sometimes), bid-ask spreads, may track niche sectors.</p>
              </div>
              <div className="vehicle-item">
                <h4>Bonds</h4>
                <p className="info-text">Debt securities issued by corporations or governments. Bondholders receive periodic interest payments and return of principal at maturity.</p>
                <p className="vehicle-pros"><strong>Pros:</strong> Regular income (coupon payments), lower volatility than stocks, preservation of capital if held to maturity.</p>
                <p className="vehicle-cons"><strong>Cons:</strong> Interest rate risk, credit/default risk, lower long-term returns compared to equities.</p>
              </div>
              <div className="vehicle-item">
                <h4>Mutual Fund</h4>
                <p className="info-text">A pooled investment vehicle managed by a professional. Investors buy shares in the fund, and the manager allocates money across stocks, bonds, or other assets.</p>
                <p className="vehicle-pros"><strong>Pros:</strong> Instant diversification, professional management, automatic reinvestment of dividends.</p>
                <p className="vehicle-cons"><strong>Cons:</strong> Management fees, potential load fees, less control over individual holdings.</p>
              </div>
            </div>
            <div className="vehicle-tips-summary">
              <h4 className="tips-title">Choosing the Right Vehicle</h4>
              <ul className="tips-list">
                <li><strong>Match to Goals:</strong> Align your investment vehicle with your time horizon and risk tolerance.</li>
                <li><strong>Maximize Employer Match:</strong> Always contribute enough to your 401(k) to get the full employer match if available.</li>
                <li><strong>Consider Taxes:</strong> Know the tax advantages and withdrawal rules for each vehicle.</li>
                <li><strong>Keep Costs Low:</strong> Favor low-fee index funds and ETFs for long-term growth.</li>
                <li><strong>Diversify:</strong> Use a mix of vehicles to balance risk and reward.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* 
  5) Glossary Component 
  Redesigned: Responsive card grid, icons, stylish search, modern layout.
*/
const Glossary = ({ onBack }) => {
  const [search, setSearch] = React.useState("");
  const glossaryData = [
    { term: "Stock", definition: "A share of ownership in a company." },
    { term: "Bond", definition: "A debt security representing a loan made by an investor to a borrower." },
    { term: "Compound Interest", definition: "Interest calculated on both the principal and the accumulated interest." },
    { term: "Diversification", definition: "Spreading investments to reduce risk." },
    { term: "Dividend", definition: "A portion of a company's earnings distributed to shareholders." },
    { term: "Portfolio", definition: "A collection of investments held by an individual or organization." },
    { term: "Market Capitalization", definition: "The total market value of a company's outstanding shares." },
    { term: "Mutual Fund", definition: "An investment vehicle that pools money from many investors to purchase securities." },
    { term: "ETF", definition: "An Exchange-Traded Fund that tracks an index and trades like a stock." },
    { term: "Index Fund", definition: "A fund designed to follow a market index." },
    { term: "Risk", definition: "The potential for losing money on an investment." },
    { term: "Return", definition: "The profit or loss made on an investment." },
    { term: "Asset", definition: "Anything valuable that is owned." },
    { term: "Liquidity", definition: "How quickly an asset can be converted into cash." },
    { term: "Volatility", definition: "The degree of variation in the price of a financial instrument over time." },
    { term: "Blue-Chip", definition: "Large, financially sound companies with a history of reliable performance." },
    { term: "Growth Stock", definition: "A stock expected to grow at an above-average rate." },
    { term: "Value Stock", definition: "A stock that appears undervalued based on fundamentals." },
    { term: "Market Order", definition: "An order to buy or sell a security immediately at the best available price." },
    { term: "Limit Order", definition: "An order to buy or sell a security at a specified price or better." },
    { term: "Capital Gain", definition: "The profit from selling an asset for more than its purchase price." },
    { term: "Reinvestment", definition: "Using dividends or interest to purchase additional shares." },
    { term: "Expense Ratio", definition: "The annual fee expressed as a percentage of assets, charged by mutual funds and ETFs." },
    { term: "Yield", definition: "The income return on an investment, such as interest or dividends." },
    { term: "Principal", definition: "The original sum of money invested or loaned." },
    { term: "Roth IRA", definition: "A retirement account allowing tax-free growth and tax-free withdrawals in retirement." },
    { term: "401(k)", definition: "A tax-advantaged retirement savings plan offered by many employers." },
    { term: "Short Selling", definition: "Selling a security you do not own, hoping to buy it back at a lower price." },
    { term: "Bull Market", definition: "A market condition where prices are rising or expected to rise." },
    { term: "Bear Market", definition: "A market condition where prices are falling or expected to fall." },
    { term: "Diversified Fund", definition: "A fund that invests in a wide variety of assets to reduce risk." },
    { term: "REIT", definition: "Real Estate Investment Trust, a company that owns or finances income-producing real estate." },
    { term: "IPO", definition: "Initial Public Offering, the first sale of stock by a private company to the public." },
    { term: "Credit Score", definition: "A number representing a person's creditworthiness based on credit history." },
    { term: "Inflation", definition: "The rate at which the general level of prices for goods and services is rising." },
    { term: "Deflation", definition: "A decrease in the general price level of goods and services." },
    { term: "Asset Allocation", definition: "The process of dividing investments among different asset categories." },
    { term: "Fiduciary", definition: "A person or organization that acts on behalf of another, putting their clients' interests ahead of their own." },
    { term: "Annuity", definition: "A financial product that pays out a fixed stream of payments, typically used as an income stream for retirees." },
    { term: "Margin", definition: "Borrowed money that is used to purchase securities." },
    { term: "P/E Ratio", definition: "Price-to-Earnings Ratio, a valuation of a company's current share price compared to its per-share earnings." },
    { term: "Treasury Bond", definition: "A long-term, fixed-interest government debt security with a maturity of more than 10 years." },
    { term: "CD", definition: "Certificate of Deposit, a savings certificate with a fixed maturity date and specified interest rate." },
    { term: "Net Worth", definition: "The value of all assets owned minus all liabilities owed." },
    { term: "S&P 500", definition: "A stock market index tracking the performance of 500 large companies listed on stock exchanges in the US." },
    { term: "ESG Investing", definition: "Investing that considers environmental, social, and governance factors." },
    { term: "Dollar-Cost Averaging", definition: "Investing a fixed amount of money at regular intervals, regardless of the share price." },
    { term: "Custodial Account", definition: "A financial account set up for a minor, managed by an adult until the child reaches adulthood." },
    { term: "Load Fund", definition: "A mutual fund that charges a commission or sales fee when shares are bought or sold." },
    { term: "No-Load Fund", definition: "A mutual fund that does not charge any type of sales load or commission." },
    { term: "Alpha", definition: "A measure of an investment's performance relative to a benchmark index." },
    { term: "Beta", definition: "A measure of a stock's volatility in relation to the overall market." },
    { term: "Sharpe Ratio", definition: "A measure for calculating risk-adjusted return." },
    { term: "Hedge Fund", definition: "An investment fund that employs diverse and complex strategies to earn active return for its investors." },
    { term: "Options", definition: "Financial derivatives that give the right, but not the obligation, to buy or sell an asset at a set price." },
    { term: "Yield Curve", definition: "A line that plots interest rates of bonds having equal credit quality but differing maturity dates." },
    { term: "Stop-Loss Order", definition: "An order placed with a broker to buy or sell once the stock reaches a certain price." },
    { term: "Tax-Deferred", definition: "Investment earnings such as interest, dividends, or capital gains that accumulate tax free until withdrawal." },
    { term: "Vesting", definition: "The process by which an employee earns the right to keep employer-provided benefits." },
    { term: "FICO Score", definition: "A type of credit score created by the Fair Isaac Corporation." },
    { term: "Robo-Advisor", definition: "A digital platform that provides automated, algorithm-driven financial planning services." },
    { term: "Growth Fund", definition: "A mutual fund that invests in companies expected to grow at an above-average rate." },
    { term: "Value Fund", definition: "A mutual fund that invests in undervalued companies." },
    { term: "Callable Bond", definition: "A bond that can be redeemed by the issuer before its maturity date." },
    { term: "Municipal Bond", definition: "A bond issued by a state, municipality, or county to finance its capital expenditures." },
  ];

  // Optionally add icons per term, or use a default icon
  const icons = [
    "💡", "📈", "📉", "💰", "🏦", "📊", "🔍", "📚", "🧮", "📝", "🔒", "📆", "🏅", "🪙", "💳", "🔗", "🧑‍💼", "📃", "🛡️", "🏛️", "🔔", "💸", "🪜", "💹", "🧾", "🪙", "🛡️", "🏦", "🔄", "🐂", "🐻", "🌐", "🏢", "🚀", "💳", "📈", "📉", "⚖️", "🤝", "💵", "💸", "📊", "🏦", "💳", "🧾"
  ];
  const filteredGlossary = glossaryData.filter(({ term, definition }) =>
    term.toLowerCase().includes(search.toLowerCase()) ||
    definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glossary-page">
      <h2 className="glossary-title">Glossary of Financial Terms</h2>
      <div className="glossary-search-bar">
        <input
          className="glossary-search-input"
          type="text"
          placeholder="🔍 Search terms..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="glossary-card-grid">
        {filteredGlossary.length === 0 ? (
          <div className="glossary-no-results">No terms found.</div>
        ) : (
          filteredGlossary.map(({ term, definition }, idx) => (
            <div className="glossary-card" key={term}>
              <div className="glossary-card-icon">{icons[idx % icons.length]}</div>
              <div className="glossary-card-term">{term}</div>
              <div className="glossary-card-definition">{definition}</div>
            </div>
          ))
        )}
      </div>
      <button className="info-button" onClick={onBack} style={{ marginTop: 32 }}>
        ← Back to Simulator
      </button>
    </div>
  );
};

/* 
  6) InvestorQuiz Component 
  Fills entire viewport with a gradient from the body,
  plus a white "card" with green border around the quiz content.
*/
const InvestorQuiz = ({ onBack }) => {
  const questions = [
    {
      question: "How comfortable are you with risk?",
      options: [
        { text: "Very uncomfortable", score: 1 },
        { text: "Somewhat uncomfortable", score: 2 },
        { text: "Neutral", score: 3 },
        { text: "Comfortable", score: 4 },
      ],
    },
    {
      question: "How much do you value safety over returns?",
      options: [
        { text: "Safety is my top priority", score: 1 },
        { text: "I prefer moderate safety", score: 2 },
        { text: "I'm balanced", score: 3 },
        { text: "I sacrifice safety for high returns", score: 4 },
      ],
    },
    {
      question: "How long do you plan to invest?",
      options: [
        { text: "Less than 5 years", score: 1 },
        { text: "5-10 years", score: 2 },
        { text: "10-20 years", score: 3 },
        { text: "20+ years", score: 4 },
      ],
    },
    {
      question: "How do you react to market downturns?",
      options: [
        { text: "I panic and sell", score: 1 },
        { text: "I feel uneasy but hold", score: 2 },
        { text: "I stay calm", score: 3 },
        { text: "I see it as a buying opportunity", score: 4 },
      ],
    },
    {
      question: "How important is liquidity to you?",
      options: [
        { text: "Very important", score: 1 },
        { text: "Somewhat important", score: 2 },
        { text: "Not very important", score: 3 },
        { text: "Not important at all", score: 4 },
      ],
    },
    {
      question: "What is your primary investment goal?",
      options: [
        { text: "Preservation of capital", score: 1 },
        { text: "Steady income", score: 2 },
        { text: "Moderate growth", score: 3 },
        { text: "Aggressive growth", score: 4 },
      ],
    },
    {
      question: "How often do you review your investments?",
      options: [
        { text: "Rarely", score: 1 },
        { text: "Once a year", score: 2 },
        { text: "A few times a year", score: 3 },
        { text: "Regularly and actively", score: 4 },
      ],
    },
    {
      question: "How much do you know about investing terms?",
      options: [
        { text: "Not much", score: 1 },
        { text: "Some", score: 2 },
        { text: "A moderate amount", score: 3 },
        { text: "A lot", score: 4 },
      ],
    },
    {
      question: "Which best describes your investment style?",
      options: [
        { text: "Conservative", score: 1 },
        { text: "Cautious", score: 2 },
        { text: "Balanced", score: 3 },
        { text: "Aggressive", score: 4 },
      ],
    },
    {
      question: "How important is outperforming the market to you?",
      options: [
        { text: "Not important", score: 1 },
        { text: "Somewhat important", score: 2 },
        { text: "Important", score: 3 },
        { text: "Very important", score: 4 },
      ],
    },
  ];

  const totalQuestions = questions.length;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const handleOptionSelect = (optionScore) => {
    const newAnswers = [...answers, optionScore];
    setAnswers(newAnswers);

    if (currentQuestion + 1 < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const totalScore = newAnswers.reduce((a, b) => a + b, 0);
      setScore(totalScore);
      setQuizCompleted(true);
    }
  };

  const progressPercentage = Math.round(
    ((currentQuestion + (quizCompleted ? 1 : 0)) / totalQuestions) * 100
  );

  return (
    <div className="quiz-container">
      <div className="quiz-inner">
        <h2 className="quiz-title">Investor Personality Quiz</h2>
        {!quizCompleted ? (
          <>
            <div className="quiz-progress-bar">
              <div
                className="quiz-progress"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="quiz-question">
              <p>{questions[currentQuestion].question}</p>
            </div>
            <div className="quiz-options">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  className="quiz-option"
                  onClick={() => handleOptionSelect(option.score)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="quiz-completion-card">
              <h3 className="completion-title">🎉 Quiz Completed!</h3>
              <p className="completion-score">Your total score is: <span>{score}</span></p>
              <p className="completion-feedback">
                {score <= 15
                  ? "You have a very conservative investment style."
                  : score <= 25
                  ? "You have a cautious investment style."
                  : score <= 35
                  ? "You have a balanced investment style."
                  : "You have an aggressive investment style."}
              </p>
              <button className="info-button completion-back" onClick={onBack}>
                Back to Simulator
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* 
  7) BudgetPlanner Component 
  Includes a Savings Goal Calculator and a Budget Allocation Guide
*/
const BudgetPlanner = ({ onBack }) => {
  const [currentSavingsStr, setCurrentSavingsStr] = useState("");
  const [goalStr, setGoalStr] = useState("");
  const [monthlySavingsStr, setMonthlySavingsStr] = useState("");
  const [annualRateStr, setAnnualRateStr] = useState("");
  const [goalResult, setGoalResult] = useState("");

  const calculateMonthsToGoal = () => {
    const currentSavings = Number(currentSavingsStr) || 0;
    const goal = Number(goalStr) || 0;
    const monthlySavings = Number(monthlySavingsStr) || 0;
    const annualRate = Number(annualRateStr) || 0;

    let months = 0;
    let balance = currentSavings;
    const monthlyRate = annualRate / 12;
    while (balance < goal && months < 1000) {
      balance = balance * (1 + monthlyRate) + monthlySavings;
      months++;
    }
    if (months >= 1000) {
      setGoalResult("Goal not achievable within a reasonable time frame.");
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      setGoalResult(
        `It will take approximately ${years} years and ${remainingMonths} months to reach your goal.`
      );
    }
  };

  // For each input, strip leading zeros onChange
  const handleCurrentSavingsChange = (e) => {
    const stripped = e.target.value.replace(/^0+/, "");
    setCurrentSavingsStr(stripped);
  };
  const handleGoalChange = (e) => {
    const stripped = e.target.value.replace(/^0+/, "");
    setGoalStr(stripped);
  };
  const handleMonthlySavingsChange = (e) => {
    const stripped = e.target.value.replace(/^0+/, "");
    setMonthlySavingsStr(stripped);
  };
  const handleAnnualRateChange = (e) => {
    const stripped = e.target.value.replace(/^0+/, "");
    setAnnualRateStr(stripped);
  };

  return (
    <div className="budget-planner-page card budget-fadein">
      <h2 className="budget-planner-title">Budget & Savings Planner</h2>

      {/* Savings Goal Calculator Section */}
      <div className="budget-section">
        <h3 className="budget-section-title">Savings Goal Calculator</h3>
        <form className="budget-form spread-budget-form budget-grid-2x2" onSubmit={e => e.preventDefault()}>
          <label>Current Savings ($):
            <input
              type="number"
              min="0"
              value={currentSavingsStr}
              onChange={handleCurrentSavingsChange}
              placeholder="e.g. 1000"
            />
          </label>
          <label>Savings Goal ($):
            <input
              type="number"
              min="0"
              value={goalStr}
              onChange={handleGoalChange}
              placeholder="e.g. 10000"
            />
          </label>
          <label>Monthly Savings ($):
            <input
              type="number"
              min="0"
              value={monthlySavingsStr}
              onChange={handleMonthlySavingsChange}
              placeholder="e.g. 200"
            />
          </label>
          <label>Annual Interest Rate (decimal):
            <input
              type="number"
              min="0"
              value={annualRateStr}
              step="0.01"
              onChange={handleAnnualRateChange}
              placeholder="e.g. 0.05"
            />
          </label>
          <div className="budget-calc-btn-row" style={{ gridColumn: '1 / -1' }}>
    <button type="button" className="info-button budget-calc-btn" onClick={calculateMonthsToGoal}>
      Calculate Goal Time
    </button>
  </div>
  {goalResult && <p className="budget-result" style={{ gridColumn: '1 / -1' }}>{goalResult}</p>}
</form>
      </div>

      <div className="divider-budget"></div>

      {/* Budget Allocation Guide Section */}
      <div className="budget-section">
        <h3 className="budget-section-title">Budget Allocation Guide</h3>
        <div className="budget-guide">
          <p>
            A well-planned budget helps you balance your income and expenses while saving for the future. 
            One popular guideline is the <strong>50/30/20 rule</strong>:
          </p>
          <ul>
            <li>
              <strong>50% for Needs:</strong> Allocate half of your income for essential expenses 
              (e.g., housing, food, and transportation).
            </li>
            <li>
              <strong>30% for Wants:</strong> Use about 30% of your income for non-essential items 
              (e.g., entertainment, dining out, or hobbies).
            </li>
            <li>
              <strong>20% for Savings:</strong> Reserve 20% of your income for savings, investments, 
              or paying off debt.
            </li>
          </ul>
          <p>
            Keep in mind that these percentages are guidelines, not strict rules. Everyone's financial 
            situation is different. If your "needs" exceed 50% of your income, you may need to reduce 
            your "wants" category or find ways to cut essential costs. If you want to save aggressively, 
            you can increase the savings percentage.
          </p>
          <p>
            The most important step is to <strong>track your spending</strong> and regularly review your budget. 
            This helps you spot areas where you can adjust and ensures you're setting aside enough for 
            your long-term goals. Consistency and awareness are key to successful budgeting!
          </p>
        </div>
      </div>

      <button className="info-button budget-back-button" onClick={onBack}>
        Back to Simulator
      </button>
    </div>
  );
};

/* 
  8) CombinedGraph: plots two scenarios on a single SVG
     Now also shows final savings for each scenario below the SVG.
*/
const CombinedGraph = ({ scenarios }) => {
  // Convert each scenario's strings → numbers
  const allData = scenarios.map((s) => {
    const P = Number(s.principalStr) || 0;
    const r = Number(s.rateStr) || 0;
    const t = Number(s.yearsStr) || 0;
    const n = Number(s.compoundingsStr) || 1;
    const C = Number(s.monthlyContributionStr) || 0;
    return calculateCompoundInterest(P, r, t, n, C);
  });
  const xMax = Math.max(...scenarios.map((s) => Number(s.yearsStr) || 0));
  const yMax = allData.reduce((max, dataArr) => {
    return Math.max(max, dataArr.reduce((m2, pt) => (pt.y > m2 ? pt.y : m2), 0));
  }, 0);

  // final savings for each scenario
  const finalA = allData[0]?.[allData[0].length - 1].y.toFixed(2) || "0.00";
  const finalB = allData[1]?.[allData[1].length - 1].y.toFixed(2) || "0.00";

  return (
    <div className="graph-container card">
      <h3 className="graph-title">Scenario Comparison</h3>
      <svg width="700" height="350" viewBox="-50 -50 600 400">
        {/* Vertical grid lines */}
        {[...Array(6)].map((_, i) => (
          <g key={`v-${i}`}>
            <line x1={i * 100} y1="0" x2={i * 100} y2="300" stroke="#ddd" />
            <text x={i * 100} y="320" fontSize="12" textAnchor="middle">
              {Math.round((i / 5) * xMax)}
            </text>
          </g>
        ))}
        {/* Horizontal grid lines */}
        {[...Array(6)].map((_, i) => (
          <g key={`h-${i}`}>
            <line x1="0" y1={i * 50} x2="500" y2={i * 50} stroke="#ddd" />
            <text x="-20" y={300 - i * 50} fontSize="12" textAnchor="end">
              {Math.round((i / 5) * yMax)}
            </text>
          </g>
        ))}
        {/* Axes */}
        <line x1="0" y1="300" x2="500" y2="300" stroke="#333" strokeWidth="2" />
        <line x1="0" y1="0" x2="0" y2="300" stroke="#333" strokeWidth="2" />
        {/* Axis labels */}
        <text x="250" y="350" fontSize="14" textAnchor="middle">
          Years Invested
        </text>
        <text
          x="-70"
          y="100"
          fontSize="14"
          textAnchor="middle"
          transform="rotate(-90,-50,125)"
        >
          Total Savings ($)
        </text>
        {/* Polylines for each scenario */}
        {allData.map((dataArr, idx) => (
          <polyline
            key={`poly-${idx}`}
            fill="none"
            stroke={scenarios[idx].color}
            strokeWidth="3"
            points={dataArr
              .map(
                ({ x, y }) =>
                  `${(x / xMax) * 500},${300 - (y / yMax) * 300}`
              )
              .join(" ")}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="legend-container">
        {scenarios.map((s, idx) => (
          <div key={`leg-${idx}`} className="legend-item">
            <span
              className="legend-color-box"
              style={{ backgroundColor: s.color }}
            ></span>
            <span className="legend-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Final Savings Display */}
      <div className="comparison-final">
        <p>
          <strong>Scenario A Final Savings:</strong> ${finalA}
        </p>
        <p>
          <strong>Scenario B Final Savings:</strong> ${finalB}
        </p>
      </div>
    </div>
  );
};

/* 
  9) CombinedDesmos: interactive Desmos view for two scenarios
*/
const CombinedDesmos = ({ scenarios }) => {
  const calculatorRef = useRef(null);
  const calculator = useRef(null);

  useEffect(() => {
    if (!calculator.current && window.Desmos) {
      calculator.current = window.Desmos.GraphingCalculator(calculatorRef.current, {
        expressions: true,
        expressionsCollapsed: true,
        settingsMenu: false,
      });
      calculator.current.updateSettings({ expressionsCollapsed: true });
    }
    if (calculator.current) {
      scenarios.forEach((s, idx) => {
        const P = Number(s.principalStr) || 0;
        const r = Number(s.rateStr) || 0;
        const t = Number(s.yearsStr) || 0;
        const n = Number(s.compoundingsStr) || 1;
        const C = Number(s.monthlyContributionStr) || 0;

        const exprId = `compound${idx}`;
        const latex = `A_${idx}(t) = ${P} \\left(1+\\frac{${r}}{${n}}\\right)^{${n} t} + ${C} \\left(\\frac{\\left(1+\\frac{${r}}{12}\\right)^{12 t} - 1}{${r}/12}\\right)`;
        calculator.current.setExpression({
          id: exprId,
          latex,
          color: s.color,
          lineWidth: 2,
        });
      });
      const maxYears = Math.max(...scenarios.map((s) => Number(s.yearsStr) || 0));
      const finalYs = scenarios.map((s) => {
        const P = Number(s.principalStr) || 0;
        const r = Number(s.rateStr) || 0;
        const t = Number(s.yearsStr) || 0;
        const n = Number(s.compoundingsStr) || 1;
        const C = Number(s.monthlyContributionStr) || 0;
        const pg = P * Math.pow(1 + r / n, n * t);
        const cg =
          C * ((Math.pow(1 + r / 12, 12 * t) - 1) / (r / 12));
        return pg + cg;
      });
      const maxY = Math.max(...finalYs);
      calculator.current.setMathBounds({
        left: 0,
        right: maxYears <= 0 ? 10 : maxYears,
        bottom: 0,
        top: maxY > 0 ? maxY * 1.1 : 1000,
      });
    }
  }, [scenarios]);

  return (
    <div className="desmos-container card">
      <h3 className="graph-title">Desmos Interactive Comparison</h3>
      <div ref={calculatorRef} style={{ width: "900px", height: "450px", margin: "0 auto" }} />
    </div>
  );
};

/* 
  10) YearlyBreakdownComparison:
      Two side-by-side tables, one per scenario
*/
const YearlyBreakdownComparison = ({ scenarios }) => {
  return (
    <div className="yearly-breakdown-comparison">
      {scenarios.map((s, idx) => {
        const P = Number(s.principalStr) || 0;
        const r = Number(s.rateStr) || 0;
        const t = Number(s.yearsStr) || 0;
        const n = Number(s.compoundingsStr) || 1;
        const C = Number(s.monthlyContributionStr) || 0;

        const breakdown = [];
        for (let i = 0; i <= t; i++) {
          const principalGrowth = P * Math.pow(1 + r / n, n * i);
          const contributionsGrowth =
            C * ((Math.pow(1 + r / 12, 12 * i) - 1) / (r / 12));
          breakdown.push({
            year: i,
            principalGrowth,
            contributionsGrowth,
            total: principalGrowth + contributionsGrowth,
          });
        }
        return (
          <div key={`breakdown-${idx}`} className="yearly-breakdown card">
            <h3 className="breakdown-title">{s.label} Year-by-Year</h3>
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Principal Growth ($)</th>
                  <th>Contributions ($)</th>
                  <th>Total ($)</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item) => (
                  <tr key={item.year}>
                    <td>{item.year}</td>
                    <td>{item.principalGrowth.toFixed(2)}</td>
                    <td>{item.contributionsGrowth.toFixed(2)}</td>
                    <td>{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

const FINANCE_QUESTIONS = [
  {type: "mc", question: "What does 'diversification' mean in investing?", options: ["Investing in a single stock", "Spreading investments across different assets", "Investing only in bonds", "Putting all money in cash"], answer: 1},
  {type: "mc", question: "Which account is typically used for retirement savings in the US?", options: ["Roth IRA", "529 Plan", "HSA", "Checking Account"], answer: 0},
  {type: "mc", question: "What is a stock dividend?", options: ["A fee for buying stocks", "A portion of company profits paid to shareholders", "A type of bond", "A stock split"], answer: 1},
  {type: "mc", question: "Which of the following is considered a low-risk investment?", options: ["Cryptocurrency", "Savings Account", "Penny Stocks", "Options Trading"], answer: 1},
  {type: "mc", question: "What does 'liquidity' refer to?", options: ["How quickly an asset can be converted to cash", "The amount of water in a company", "A company's debt", "The number of shares outstanding"], answer: 0},
  {type: "mc", question: "What is the primary purpose of a budget?", options: ["To track spending and manage money", "To increase debt", "To avoid taxes", "To invest in stocks"], answer: 0},
  {type: "mc", question: "Which of the following is a fixed expense?", options: ["Rent or mortgage payment", "Groceries", "Clothing", "Entertainment"], answer: 0},
  {type: "mc", question: "What does APR stand for?", options: ["Annual Percentage Rate", "Annual Payment Ratio", "Asset Performance Rating", "Average Price Range"], answer: 0},
  {type: "mc", question: "A 401(k) is best described as:", options: ["A retirement savings plan offered by employers", "A type of health insurance", "A government bond", "A checking account"], answer: 0},
  {type: "mc", question: "Which is NOT a credit bureau?", options: ["Equifax", "TransUnion", "Experian", "Vanguard"], answer: 3},
  {type: "mc", question: "If you pay only the minimum payment on your credit card, what happens?", options: ["You pay more interest over time", "Your balance is paid off immediately", "Your credit score increases quickly", "You avoid all fees"], answer: 0},
  {type: "mc", question: "Which investment is typically considered the riskiest?", options: ["Stocks", "Bonds", "Savings Account", "Certificate of Deposit (CD)"], answer: 0},
  {type: "mc", question: "What is a mutual fund?", options: ["A pool of money from many investors to buy securities", "A type of insurance", "A checking account", "A tax form"], answer: 0},
  {type: "mc", question: "What does FICO score measure?", options: ["Creditworthiness", "Net worth", "Income", "Debt-to-income ratio"], answer: 0},
  {type: "mc", question: "Which of the following is NOT an asset?", options: ["Car loan", "Savings account", "House", "Stocks"], answer: 0},
  {type: "mc", question: "Which financial product protects against loss from accidents or theft?", options: ["Insurance", "Mutual fund", "Bond", "Stock"], answer: 0},
  {type: "mc", question: "What is compound interest?", options: ["Interest calculated on both principal and accumulated interest", "Interest paid only on the principal", "A fee for early withdrawal", "A type of bond"], answer: 0},
  {type: "mc", question: "Which is a sign of identity theft?", options: ["Unfamiliar accounts on your credit report", "A higher interest rate on your loan", "A lower credit score", "A declined credit card application"], answer: 0},
  {type: "mc", question: "What is an emergency fund?", options: ["Money set aside for unexpected expenses", "A retirement account", "A student loan", "A stock portfolio"], answer: 0},
  {type: "mc", question: "Which government agency insures bank deposits in the US?", options: ["FDIC", "SEC", "IRS", "FBI"], answer: 0},
  {type: "mc", question: "Which is NOT a benefit of a high credit score?", options: ["Lower interest rates", "Easier loan approval", "Higher insurance premiums", "Better credit card offers"], answer: 2},
  {type: "mc", question: "What is the purpose of insurance?", options: ["To protect against financial loss", "To increase investment returns", "To avoid taxes", "To pay off debt"], answer: 0},
  {type: "mc", question: "Which is a feature of a Certificate of Deposit (CD)?", options: ["Fixed interest rate for a set term", "Unlimited withdrawals", "No minimum deposit", "Interest rate changes daily"], answer: 0},
  {type: "mc", question: "What is the main advantage of a Roth IRA?", options: ["Tax-free withdrawals in retirement", "Immediate tax deduction", "Employer matching", "Higher contribution limits"], answer: 0},
  {type: "mc", question: "Which is NOT a type of investment risk?", options: ["Market risk", "Inflation risk", "Interest rate risk", "Budget risk"], answer: 3},
  {type: "mc", question: "What does 'pay yourself first' mean?", options: ["Save money before spending on other things", "Spend all your money first", "Pay your bills last", "Invest only in stocks"], answer: 0},
  {type: "mc", question: "What is the main benefit of a 529 Plan?", options: ["Tax-advantaged savings for education", "Higher interest rates", "Employer matching", "Unlimited withdrawals"], answer: 0},
  {type: "mc", question: "Which is NOT a stock market index?", options: ["S&P 500", "NASDAQ", "Dow Jones", "FICO"], answer: 3},
  {type: "mc", question: "What is a bond?", options: ["A loan to a government or corporation", "Ownership in a company", "A type of insurance", "A checking account"], answer: 0},
  {type: "mc", question: "Which is a benefit of direct deposit?", options: ["Faster access to your money", "Higher interest rates", "Lower taxes", "Free credit reports"], answer: 0},
  {type: "mc", question: "What does 'net worth' mean?", options: ["Assets minus liabilities", "Total income", "Total expenses", "Total investments"], answer: 0},
  {type: "mc", question: "Which is an example of a want, not a need?", options: ["Streaming service subscription", "Groceries", "Rent", "Utilities"], answer: 0},
  {type: "mc", question: "What is the main purpose of a checking account?", options: ["To manage daily spending and payments", "To earn high interest", "To invest in stocks", "To pay taxes"], answer: 0},
  {type: "mc", question: "What is the benefit of an employer 401(k) match?", options: ["Free money for retirement savings", "Lower taxes now", "Higher credit score", "No withdrawal penalties"], answer: 0},
  {type: "mc", question: "Which is NOT a form of income?", options: ["Groceries", "Salary", "Interest", "Dividends"], answer: 0},
  {type: "mc", question: "What is a stock?", options: ["Ownership in a company", "A type of loan", "A government bond", "A credit score"], answer: 0},
  {type: "mc", question: "Which is a good reason to refinance a loan?", options: ["To get a lower interest rate", "To increase your debt", "To pay more interest", "To shorten your credit history"], answer: 0},
  {type: "mc", question: "What is the main risk of not having health insurance?", options: ["High medical bills", "Lower taxes", "Higher interest rates", "More investment options"], answer: 0},
  {type: "mc", question: "Which is a sign of financial trouble?", options: ["Missing bill payments", "Saving regularly", "Paying credit cards in full", "Tracking expenses"], answer: 0},
  {type: "mc", question: "What is the main purpose of a savings account?", options: ["To save money securely and earn interest", "To pay bills", "To invest in stocks", "To apply for loans"], answer: 0},
  {type: "mc", question: "Which is NOT a benefit of budgeting?", options: ["Overspending", "Saving for goals", "Tracking expenses", "Reducing debt"], answer: 0},
  {type: "mc", question: "What is a credit limit?", options: ["The maximum amount you can borrow on a credit card", "The minimum payment due", "The number of credit cards you have", "The interest rate charged"], answer: 0},
  {type: "mc", question: "Which is a consequence of late credit card payments?", options: ["Late fees and lower credit score", "Higher savings", "Lower interest rates", "Increased credit limit"], answer: 0},
  {type: "mc", question: "What is the main benefit of a high-yield savings account?", options: ["Higher interest earnings", "Lower fees", "More checks", "Fewer statements"], answer: 0},
  {type: "mc", question: "Which is NOT a type of insurance?", options: ["Checking account", "Health insurance", "Auto insurance", "Homeowners insurance"], answer: 0},
  {type: "mc", question: "What is the main purpose of a will?", options: ["To direct how your assets are distributed after death", "To lower taxes", "To increase net worth", "To pay off debt"], answer: 0},
  {type: "mc", question: "Which is a benefit of automatic bill pay?", options: ["Avoiding late payments", "Higher interest rates", "Lower credit limits", "Increased debt"], answer: 0},
  {type: "mc", question: "What is inflation?", options: ["The general rise in prices over time", "A decrease in the money supply", "A drop in stock prices", "A type of insurance"], answer: 0},
  {type: "mc", question: "Which is a sign of phishing?", options: ["Unsolicited emails asking for personal info", "A bank statement", "A credit card bill", "A loan offer from your bank"], answer: 0},
  {type: "mc", question: "What is the main benefit of an emergency fund?", options: ["Financial security in case of unexpected events", "Higher credit score", "Lower insurance premiums", "More investment options"], answer: 0},
  {type: "mc", question: "Which is NOT a way to reduce expenses?", options: ["Spend more on luxury items", "Cook at home", "Cancel unused subscriptions", "Shop sales and discounts"], answer: 0},
  {type: "mc", question: "What is a secured loan?", options: ["A loan backed by collateral", "A loan with no interest", "A loan from a friend", "A loan with no repayment required"], answer: 0},
  {type: "mc", question: "Which is a benefit of refinancing student loans?", options: ["Lower interest rate or monthly payment", "Higher loan balance", "Longer repayment term", "Lower credit score"], answer: 0},
  {type: "mc", question: "What is the main purpose of a grace period?", options: ["Extra time to pay without penalty", "A period of higher interest", "A time when no payments are due", "A time to build credit"], answer: 0},
  {type: "mc", question: "Which is NOT a type of tax?", options: ["Credit tax", "Income tax", "Sales tax", "Property tax"], answer: 0},
  {type: "mc", question: "What is a balance transfer?", options: ["Moving debt from one credit card to another", "Withdrawing cash from an ATM", "Depositing a check", "Paying a bill online"], answer: 0},
  {type: "mc", question: "Which is a benefit of paying more than the minimum on a loan?", options: ["Pay off debt faster and save on interest", "Increase your credit limit", "Lower your credit score", "Increase your loan balance"], answer: 0},
  {type: "mc", question: "What is a cosigner?", options: ["Someone who agrees to repay a loan if you don't", "A bank manager", "A credit card issuer", "A loan officer"], answer: 0},
  {type: "mc", question: "Which is NOT a reason to use a credit card?", options: ["To spend beyond your means", "To build credit", "For convenience", "For rewards"], answer: 0},
  {type: "mc", question: "What is a financial statement?", options: ["A document showing financial position and performance", "A credit card bill", "A tax refund", "A loan application"], answer: 0},
  {type: "mc", question: "Which is a benefit of a flexible spending account (FSA)?", options: ["Tax-free spending on medical expenses", "Higher interest rates", "Lower loan payments", "More investment options"], answer: 0},
  {type: "mc", question: "What is a dividend?", options: ["A payment to shareholders from company profits", "A type of loan", "A credit card fee", "A tax deduction"], answer: 0},
  {type: "mc", question: "Which is NOT a benefit of investing early?", options: ["Immediate high returns", "More time for growth", "Compound interest", "Greater financial security"], answer: 0},
  {type: "mc", question: "What is a money market account?", options: ["A savings account with higher interest and limited transactions", "A checking account", "A credit card", "A loan"], answer: 0},
  {type: "mc", question: "Which is a benefit of setting financial goals?", options: ["Motivation to save and spend wisely", "Higher taxes", "More debt", "Lower credit score"], answer: 0},
  {type: "mc", question: "What is a tax deduction?", options: ["An amount subtracted from taxable income", "A penalty for late payment", "A loan payment", "A credit card fee"], answer: 0},
  {type: "mc", question: "Which is NOT a benefit of using a budget?", options: ["Overspending", "Saving for goals", "Tracking expenses", "Reducing debt"], answer: 0},
  {type: "mc", question: "What is a financial planner?", options: ["A professional who helps create and achieve financial goals", "A tax form", "A bank account", "A loan"], answer: 0},
  {type: "mc", question: "Which is a benefit of a health savings account (HSA)?", options: ["Tax advantages for medical expenses", "Higher loan limits", "Lower insurance premiums", "More investment options"], answer: 0},
  {type: "mc", question: "What is a mortgage?", options: ["A loan to buy real estate", "A type of insurance", "A savings account", "A credit card"], answer: 0},
  {type: "mc", question: "Which is NOT a benefit of paying off debt early?", options: ["Higher interest costs", "Lower stress", "Improved credit score", "More money for savings"], answer: 0},
  {type: "mc", question: "What is the main purpose of a credit card grace period?", options: ["Avoid interest if paid in full by due date", "Lower your credit score", "Increase your credit limit", "Get more rewards"], answer: 0},
  {type: "mc", question: "Which is a benefit of using a debit card?", options: ["Directly access your bank funds", "Borrow money from the bank", "Increase your credit score", "Earn airline miles"], answer: 0},
  {type: "mc", question: "What is a budget deficit?", options: ["Expenses exceed income", "Income exceeds expenses", "No savings", "Negative net worth"], answer: 0},
  {type: "mc", question: "Which financial product protects against loss from accidents or theft?", options: ["Insurance", "Mutual fund", "Bond", "Stock"], answer: 0},
  {type: "mc", question: "What is compound interest?", options: ["Interest calculated on both principal and accumulated interest", "Interest paid only on the principal", "A fee for early withdrawal", "A type of bond"], answer: 0},
  {type: "mc", question: "Which is a sign of identity theft?", options: ["Unfamiliar accounts on your credit report", "A higher interest rate on your loan", "A lower credit score", "A declined credit card application"], answer: 0},
  {type: "mc", question: "What is an emergency fund?", options: ["Money set aside for unexpected expenses", "A retirement account", "A student loan", "A stock portfolio"], answer: 0},
  {type: "mc", question: "Which government agency insures bank deposits in the US?", options: ["FDIC", "SEC", "IRS", "FBI"], answer: 0},
  {type: "mc", question: "What is a bull market?", options: ["A market where prices are rising", "A market where prices are falling", "A market with no change", "A market for agricultural goods"], answer: 0},
  {type: "mc", question: "Which is a benefit of using a credit card responsibly?", options: ["Building a positive credit history", "Paying more interest", "Increasing your debt", "Lowering your credit score"], answer: 0},
  {type: "mc", question: "What happens if you default on a loan?", options: ["You fail to repay as agreed", "You get a lower interest rate", "Your loan balance is reduced", "You receive a tax refund"], answer: 0},
  {type: "mc", question: "Which is a variable expense?", options: ["Groceries", "Car payment", "Rent", "Health insurance premium"], answer: 0},
  {type: "mc", question: "What is the main purpose of diversification?", options: ["Reduce investment risk", "Increase taxes", "Maximize debt", "Avoid budgeting"], answer: 0},
  {type: "mc", question: "What does FICO score measure?", options: ["Creditworthiness", "Net worth", "Income", "Debt-to-income ratio"], answer: 0},
  {type: "mc", question: "Which of the following is NOT an asset?", options: ["Car loan", "Savings account", "House", "Stocks"], answer: 0},
  {type: "mc", question: "Which government agency insures bank deposits in the US?", options: ["FDIC", "SEC", "IRS", "FBI"], answer: 0},
  {type: "mc", question: "What is a bull market?", options: ["A market where prices are rising", "A market where prices are falling", "A market with no change", "A market for agricultural goods"], answer: 0},
  {type: "mc", question: "Which is a benefit of using a credit card responsibly?", options: ["Building a positive credit history", "Paying more interest", "Increasing your debt", "Lowering your credit score"], answer: 0},
  {type: "mc", question: "What happens if you default on a loan?", options: ["You fail to repay as agreed", "You get a lower interest rate", "Your loan balance is reduced", "You receive a tax refund"], answer: 0},
  {type: "mc", question: "Which is a variable expense?", options: ["Groceries", "Car payment", "Rent", "Health insurance premium"], answer: 0},
  {type: "mc", question: "What is the main purpose of diversification?", options: ["Reduce investment risk", "Increase taxes", "Maximize debt", "Avoid budgeting"], answer: 0},
  {type: "mc", question: "A higher interest rate on your loan", options: ["A higher interest rate on your loan", "A lower credit score", "A declined credit card application"], answer: 0},
  {type: "mc", question: "What happens if you default on a loan?", options: ["You fail to repay as agreed", "You get a lower interest rate", "Your loan balance is reduced", "You receive a tax refund"], answer: 0},
  {type: "mc", question: "Which is a variable expense?", options: ["Groceries", "Car payment", "Rent", "Health insurance premium"], answer: 0},
  {type: "mc", question: "What is the main purpose of diversification?", options: ["Reduce investment risk", "Increase taxes", "Maximize debt", "Avoid budgeting"], answer: 0}
];

// --- END FINANCE_QUESTIONS BANK ---

const getRandomQuestion = (usedIndexes) => {
  let idx;
  do {
    idx = Math.floor(Math.random() * FINANCE_QUESTIONS.length);
  } while (usedIndexes.includes(idx) && usedIndexes.length < FINANCE_QUESTIONS.length);
  return { ...FINANCE_QUESTIONS[idx], idx };
};

const ChallengeQuiz = ({ onBack }) => {
  const [usedIndexes, setUsedIndexes] = useState([]);
  const [currentQ, setCurrentQ] = useState(getRandomQuestion([]));
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [timer, setTimer] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem("challengeHighScore")) || 0);
  const timerRef = useRef();

  // Timer logic
  useEffect(() => {
    if (gameOver) return;
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleWrongAnswer("⏰ Time's up!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameOver, level, currentQ]);

  // New question on mount and when level changes
  useEffect(() => {
    if (!gameOver) {
      setUserAnswer("");
      setFeedback("");
      setTimer(20);
    }
  }, [level, gameOver, currentQ]);

  // Handle answer input
  const handleAnswerChange = (e) => {
    setUserAnswer(e.target.value);
  };

  // Handle correct answer
  const handleCorrectAnswer = () => {
    setFeedback("🎉 Correct!");
    setScore((s) => s + 100 + timer * 5 + level * 10);
    setStreak((s) => s + 1);
    setTimeout(() => {
      setFeedback("");
      nextQuestion();
    }, 800);
  };

  // Handle wrong answer or timeout
  const handleWrongAnswer = (msg) => {
    setFeedback(msg || `❌ Oops—correct answer is ${getAnswerText(currentQ)}`);
    setStreak(0);
    setLives((l) => l - 1);
    setTimeout(() => setFeedback(""), 1200);
    if (lives - 1 <= 0) {
      setTimeout(() => setGameOver(true), 1200);
    } else {
      setTimeout(() => nextQuestion(), 1200);
    }
  };

  // Handle submit
  const handleSubmit = () => {
    if (gameOver) return;
    if (userAnswer === "") {
      setFeedback("Please select an option.");
      return;
    }
    if (userAnswer === String(currentQ.answer)) {
      clearInterval(timerRef.current);
      handleCorrectAnswer();
    } else {
      clearInterval(timerRef.current);
      handleWrongAnswer();
    }
  };

  // Game over logic
  useEffect(() => {
    if (gameOver) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("challengeHighScore", score);
      }
    }
  }, [gameOver, score, highScore]);

  // Play again
  const handleRestart = () => {
    setScore(0);
    setStreak(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setFeedback("");
    setUsedIndexes([]);
    setCurrentQ(getRandomQuestion([]));
  };

  // Next question
  const nextQuestion = () => {
    const newUsed = [...usedIndexes, currentQ.idx];
    setUsedIndexes(newUsed);
    setLevel((l) => l + 1);
    setCurrentQ(getRandomQuestion(newUsed));
  };

  // Helper to get answer text for feedback
  function getAnswerText(q) {
    if (q.type === "mc") return `"${q.options[q.answer]}"`;
    return `"${q.answer}"`;
  }

  return (
    <div className="challenge-container">
      <div className="challenge-card game-mode">
        {gameOver ? (
          <>
            <h2 className="challenge-title">Game Over!</h2>
            <p className="challenge-feedback">Final Score: <strong>{score}</strong></p>
            <p className="challenge-feedback">High Score: <strong>{highScore}</strong></p>
            <button className="challenge-button" onClick={handleRestart}>
              Play Again
            </button>
            <button className="challenge-button" onClick={onBack}>
              Back to Simulator
            </button>
          </>
        ) : (
          <>
            <div className="challenge-game-header">
              <div className="challenge-lives">{Array(lives).fill("❤️").join(" ")}</div>
              <div className="challenge-score">Score: <strong>{score}</strong></div>
              <div className="challenge-streak">🔥 Streak: {streak}</div>
              <div className="challenge-level">Level: {level}</div>
              <div className="challenge-timer">⏰ {timer}s</div>
            </div>
            <h2 className="challenge-title">Finance Quiz Game</h2>
            <div className="challenge-explanation">
              <p>
                Test your knowledge of investing, saving, and personal finance. Answer quickly for more points!
              </p>
            </div>
            <p className="challenge-question">
              {currentQ.question}
            </p>
            <div className="challenge-input-group">
              {currentQ.type === "mc" ? (
  <>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', width: '100%' }}>
      {currentQ.options.map((opt, idx) => (
        <button
          key={idx}
          className={`challenge-button${userAnswer === String(idx) ? " active" : ""}`}
          style={{ minWidth: 0, padding: "10px 18px", fontSize: 16 }}
          onClick={() => setUserAnswer(String(idx))}
          disabled={!!feedback}
          type="button"
        >
          {opt}
        </button>
      ))}
    </div>
    <button
      className="challenge-button"
      onClick={handleSubmit}
      disabled={userAnswer === "" || !!feedback}
      style={{ marginTop: 18, minWidth: 120 }}
      type="button"
    >
      Submit
    </button>
  </>
) : (
  <>
    <input
      type="number"
      value={userAnswer}
      onChange={handleAnswerChange}
      placeholder="Type your answer"
      disabled={!!feedback}
      autoFocus
      onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
      style={{ fontSize: 18, width: 260 }}
      inputMode="decimal"
      step="any"
    />
    <button className="challenge-button" onClick={handleSubmit} disabled={!!feedback || userAnswer.trim() === ""}>
      Submit
    </button>
  </>
)}
            </div>
            {feedback && <p className={`challenge-feedback ${feedback.includes('Correct') ? 'correct' : 'wrong'}`}>{feedback}</p>}
          </>
        )}
      </div>
    </div>
  );
};

/* 
  12) Main App Component 
*/
const App = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  // Top-level "view" state
  const [view, setView] = useState("single");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /* Single Simulator state (all as strings) */
  const [principalStr, setPrincipalStr] = useState("1000");
  const [rateStr, setRateStr] = useState("0.07");
  const [yearsStr, setYearsStr] = useState("10");
  const [compoundingsStr, setCompoundingsStr] = useState("12");
  const [monthlyContributionStr, setMonthlyContributionStr] = useState("");

  /* Scenario A state (strings) */
  const [principalAStr, setPrincipalAStr] = useState("1000");
  const [rateAStr, setRateAStr] = useState("0.07");
  const [yearsAStr, setYearsAStr] = useState("10");
  const [compoundingsAStr, setCompoundingsAStr] = useState("12");
  const [monthlyContributionAStr, setMonthlyContributionAStr] = useState("");

  /* Scenario B state (strings) */
  const [principalBStr, setPrincipalBStr] = useState("1000");
  const [rateBStr, setRateBStr] = useState("0.05");
  const [yearsBStr, setYearsBStr] = useState("10");
  const [compoundingsBStr, setCompoundingsBStr] = useState("12");
  const [monthlyContributionBStr, setMonthlyContributionBStr] = useState("");

  /* Popular presets for single simulator */
  const popularRates = [
    { label: "Savings (0.5%)", value: "0.005" },
    { label: "Bonds (3%)", value: "0.03" },
    { label: "Stocks (7%)", value: "0.07" },
    { label: "High (10%)", value: "0.1" },
  ];
  const compoundingFrequencies = [
    { label: "Annually", value: "1" },
    { label: "Quarterly", value: "4" },
    { label: "Monthly", value: "12" },
    { label: "Daily", value: "365" },
  ];


  const [customRateSelected, setCustomRateSelected] = useState(false);
  const [customCompoundingSelected, setCustomCompoundingSelected] = useState(false);
  const [showRateHelp, setShowRateHelp] = useState(false);
  const [showFreqHelp, setShowFreqHelp] = useState(false);

  /* Handlers that strip leading zeros */

  if (showWelcome) {
    return <WelcomePage onEnter={() => setShowWelcome(false)} />;
  }

  const handlePrincipalChange = (e) => {
    setPrincipalStr(e.target.value.replace(/^0+/, ""));
  };
  const handleRateChange = (e) => {
    setRateStr(e.target.value.replace(/^0+/, ""));
  };
  const handleYearsChange = (e) => {
    setYearsStr(e.target.value.replace(/^0+/, ""));
  };
  const handleCompoundingsChange = (e) => {
    setCompoundingsStr(e.target.value.replace(/^0+/, ""));
  };
  const handleMonthlyContributionChange = (e) => {
    setMonthlyContributionStr(e.target.value.replace(/^0+/, ""));
  };

  /* Scenario A handlers */
  const handlePrincipalAChange = (e) => {
    setPrincipalAStr(e.target.value.replace(/^0+/, ""));
  };
  const handleRateAChange = (e) => {
    setRateAStr(e.target.value.replace(/^0+/, ""));
  };
  const handleYearsAChange = (e) => {
    setYearsAStr(e.target.value.replace(/^0+/, ""));
  };
  const handleCompoundingsAChange = (e) => {
    setCompoundingsAStr(e.target.value.replace(/^0+/, ""));
  };
  const handleMonthlyContributionAChange = (e) => {
    setMonthlyContributionAStr(e.target.value.replace(/^0+/, ""));
  };

  /* Scenario B handlers */
  const handlePrincipalBChange = (e) => {
    setPrincipalBStr(e.target.value.replace(/^0+/, ""));
  };
  const handleRateBChange = (e) => {
    setRateBStr(e.target.value.replace(/^0+/, ""));
  };
  const handleYearsBChange = (e) => {
    setYearsBStr(e.target.value.replace(/^0+/, ""));
  };
  const handleCompoundingsBChange = (e) => {
    setCompoundingsBStr(e.target.value.replace(/^0+/, ""));
  };
  const handleMonthlyContributionBChange = (e) => {
    setMonthlyContributionBStr(e.target.value.replace(/^0+/, ""));
  };

  /* Prepare scenarios array for comparison (all string-based) */
  const scenarios = [
    {
      principalStr: principalAStr,
      rateStr: rateAStr,
      yearsStr: yearsAStr,
      compoundingsStr: compoundingsAStr,
      monthlyContributionStr: monthlyContributionAStr,
      label: "Scenario A",
      color: "#FF5733",
    },
    {
      principalStr: principalBStr,
      rateStr: rateBStr,
      yearsStr: yearsBStr,
      compoundingsStr: compoundingsBStr,
      monthlyContributionStr: monthlyContributionBStr,
      label: "Scenario B",
      color: "#3355FF",
    },
  ];

  /* RENDER LOGIC */
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="nav-brand" onClick={() => setView("single")}>
            <svg className="nav-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" stroke="#fff" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 17l4-4 4 4 5-5" stroke="#fff" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>InvestEdu</span>
          </a>
            <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
              <button 
                className="nav-menu-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                Menu <span className="nav-menu-icon" aria-hidden="true">▼</span>
              </button>
              <div className="nav-menu-items">
  <a className="nav-menu-item calculator" onClick={() => { setView("single"); setIsMenuOpen(false); }}>
    <span className="nav-menu-item-icon">📊</span>
    <span className="nav-menu-item-separator">|</span>
    <span className="nav-menu-item-text">Investment Calculator</span>
  </a>
  <a className="nav-menu-item comparison" onClick={() => { setView("scenario"); setIsMenuOpen(false); }}>
    <span className="nav-menu-item-icon">🔄</span>
    <span className="nav-menu-item-separator">|</span>
    <span className="nav-menu-item-text">Scenario Comparison</span>
  </a>
  <a className="nav-menu-item challenge" onClick={() => { setView("challenge"); setIsMenuOpen(false); }}>
    <span className="nav-menu-item-icon">🎯</span>
    <span className="nav-menu-item-separator">|</span>
    <span className="nav-menu-item-text">Calculator Challenge</span>
  </a>
  <a className="nav-menu-item info" onClick={() => { setView("info"); setIsMenuOpen(false); }}>
    <span className="nav-menu-item-icon">ℹ️</span>
    <span className="nav-menu-item-separator">|</span>
    <span className="nav-menu-item-text">Why Investing Matters</span>
  </a>
  <a className="nav-menu-item glossary" onClick={() => { setView("glossary"); setIsMenuOpen(false); }}>
    <span className="nav-menu-item-icon">📚</span>
    <span className="nav-menu-item-separator">|</span>
    <span className="nav-menu-item-text">Glossary of Terms</span>
  </a>
  <a className="nav-menu-item quiz" onClick={() => { setView("quiz"); setIsMenuOpen(false); }}>
    <span className="nav-menu-item-icon">❓</span>
    <span className="nav-menu-item-separator">|</span>
    <span className="nav-menu-item-text">Investor Personality Quiz</span>
  </a>
  <a className="nav-menu-item budget" onClick={() => { setView("budget"); setIsMenuOpen(false); }}>
    <span className="nav-menu-item-icon">💰</span>
    <span className="nav-menu-item-separator">|</span>
    <span className="nav-menu-item-text">Budget Planner</span>
  </a>
  <a className="nav-menu-item assistant" onClick={() => { setView("assistant"); setIsMenuOpen(false); }}>
    <span className="nav-menu-item-icon">🤖</span>
    <span className="nav-menu-item-separator">|</span>
    <span className="nav-menu-item-text">AI Assistant</span>
  </a>
</div>
          </div>
        </div>
      </nav>

      <header className="app-header">
        <h1 className="title">InvestEdu Financial Literacy Simulator</h1>
      </header>

      {view === "assistant" && (
        <div className="assistant-wrapper">
          <GeminiChat />
          <button
            className="info-button"
            style={{ margin: "20px auto 0", display: "block" }}
            onClick={() => setView("single")}
          >
            Back to Simulator
          </button>
        </div>
      )}

      {view === "info" && (
        <InfoPage />
      )}

      {view === "glossary" && (
        <Glossary onBack={() => setView("single")} />
      )}

      {view === "quiz" && (
        <InvestorQuiz onBack={() => setView("single")} />
      )}

      {view === "budget" && (
        <BudgetPlanner onBack={() => setView("single")} />
      )}

      {view === "challenge" && (
        <ChallengeQuiz onBack={() => setView("single")} />
      )}

      {view === "scenario" && (
        <div className="app-container">
          <div className="comparison-input-group">
            {/* Scenario A Inputs */}
            <div className="input-container scenario-input">
              <h3 className="scenario-title">Scenario A</h3>
              <label>Starting Investment ($):</label>
              <input
                type="number"
                min="0"
                value={principalAStr}
                onChange={handlePrincipalAChange}
                placeholder="1000"
              />
              <label>Annual Growth Rate (decimal):</label>
              <input
                type="number"
                min="0"
                value={rateAStr}
                step="0.001"
                onChange={handleRateAChange}
                placeholder="0.07"
              />
              <label>Years Invested:</label>
              <input
                type="number"
                min="0"
                value={yearsAStr}
                onChange={handleYearsAChange}
                placeholder="10"
              />
              <label>Compounding Frequency (per year):</label>
              <input
                type="number"
                min="1"
                value={compoundingsAStr}
                onChange={handleCompoundingsAChange}
                placeholder="12"
              />
              <label>Monthly Contribution ($):</label>
              <input
                type="number"
                min="0"
                value={monthlyContributionAStr}
                onChange={handleMonthlyContributionAChange}
                placeholder="200"
              />
            </div>

            {/* Scenario B Inputs */}
            <div className="input-container scenario-input">
              <h3 className="scenario-title">Scenario B</h3>
              <label>Starting Investment ($):</label>
              <input
                type="number"
                min="0"
                value={principalBStr}
                onChange={handlePrincipalBChange}
                placeholder="1000"
              />
              <label>Annual Growth Rate (decimal):</label>
              <input
                type="number"
                min="0"
                value={rateBStr}
                step="0.001"
                onChange={handleRateBChange}
                placeholder="0.05"
              />
              <label>Years Invested:</label>
              <input
                type="number"
                min="0"
                value={yearsBStr}
                onChange={handleYearsBChange}
                placeholder="10"
              />
              <label>Compounding Frequency (per year):</label>
              <input
                type="number"
                min="1"
                value={compoundingsBStr}
                onChange={handleCompoundingsBChange}
                placeholder="12"
              />
              <label>Monthly Contribution ($):</label>
              <input
                type="number"
                min="0"
                value={monthlyContributionBStr}
                onChange={handleMonthlyContributionBChange}
                placeholder="200"
              />
            </div>
          </div>

          {/* Combined SVG Graph */}
          <CombinedGraph scenarios={scenarios} />

          {/* Combined Desmos Graph */}
          <CombinedDesmos scenarios={scenarios} />

          {/* Yearly Breakdown Comparison */}
          <YearlyBreakdownComparison scenarios={scenarios} />
        </div>
      )}

      {view === "single" && (
        <div className="simulator-main-row">
          {/* Input Section (Single Simulator) */}
          <div className="input-group">
            <div className="input-container">
              <label>Starting Investment ($):</label>
              <input
                type="number"
                min="0"
                value={principalStr}
                onChange={handlePrincipalChange}
                placeholder="1000"
              />
            </div>
            <div className="input-container">
              <label>Years Invested:</label>
              <input
                type="number"
                min="0"
                value={yearsStr}
                onChange={handleYearsChange}
                placeholder="10"
              />
            </div>
            <div className="input-container">
              <label>Monthly Contribution ($):</label>
              <input
                type="number"
                min="0"
                value={monthlyContributionStr}
                onChange={handleMonthlyContributionChange}
                placeholder="200"
              />
            </div>
          </div>

          {/* Selection Section (Single Simulator) */}
          <div className="selection-group">
            <div className="selection-container">
              <div className="selection-header">
                <div
                  className="selection-info-icon"
                  onClick={() => setShowRateHelp(true)}
                  title="What is Growth Rate?"
                >
                  ?
                </div>
                <h3>Select Growth Rate:</h3>
              </div>
              <div className="rate-buttons">
                {popularRates.map((rateOption) => (
                  <button
                    key={rateOption.label}
                    className={`rate-button ${
                      !customRateSelected && rateStr === rateOption.value
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      setCustomRateSelected(false);
                      setRateStr(rateOption.value);
                    }}
                  >
                    {rateOption.label}
                  </button>
                ))}
                {!customRateSelected && (
                  <button
                    className="rate-button custom-button"
                    onClick={() => setCustomRateSelected(true)}
                  >
                    Custom
                  </button>
                )}
              </div>
              {customRateSelected && (
                <div className="custom-input">
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter custom rate (e.g., 0.075)"
                    value={rateStr}
                    onChange={handleRateChange}
                    step="0.001"
                  />
                </div>
              )}
            </div>
            <div className="selection-container">
              <div className="selection-header">
                <div
                  className="selection-info-icon"
                  onClick={() => setShowFreqHelp(true)}
                  title="What is Compounding Frequency?"
                >
                  ?
                </div>
                <h3>Select Compounding Frequency:</h3>
              </div>
              <div className="frequency-buttons">
                {compoundingFrequencies.map((freq) => (
                  <button
                    key={freq.label}
                    className={`frequency-button ${
                      !customCompoundingSelected &&
                      compoundingsStr === freq.value
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      setCustomCompoundingSelected(false);
                      setCompoundingsStr(freq.value);
                    }}
                  >
                    {freq.label}
                  </button>
                ))}
                {!customCompoundingSelected && (
                  <button
                    className="frequency-button custom-button"
                    onClick={() => setCustomCompoundingSelected(true)}
                  >
                    Custom
                  </button>
                )}
              </div>
              {customCompoundingSelected && (
                <div className="custom-input">
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter custom frequency (e.g., 24)"
                    value={compoundingsStr}
                    onChange={handleCompoundingsChange}
                    step="1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Graphs */}
          <CompoundInterestGraph
            principalStr={principalStr}
            rateStr={rateStr}
            yearsStr={yearsStr}
            compoundingsStr={compoundingsStr}
            monthlyContributionStr={monthlyContributionStr}
            title="Your Investment Growth"
          />
          <DesmosGraph
            principalStr={principalStr}
            rateStr={rateStr}
            yearsStr={yearsStr}
            compoundingsStr={compoundingsStr}
            monthlyContributionStr={monthlyContributionStr}
            title="Desmos Interactive View"
          />

          {/* Year-by-Year Breakdown */}
          <YearlyBreakdown
            principalStr={principalStr}
            rateStr={rateStr}
            yearsStr={yearsStr}
            compoundingsStr={compoundingsStr}
            monthlyContributionStr={monthlyContributionStr}
          />

          {/* Pop-ups for Growth Rate and Frequency */}
          {showRateHelp && (
            <div className="popup-overlay" onClick={() => setShowRateHelp(false)}>
              <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <h4>What is Growth Rate?</h4>
                <p>
                  The Growth Rate represents the annual return on your investment, expressed as a decimal.
                  For example, a growth rate of 0.07 means a 7% annual return.
                </p>
                <button className="close-button" onClick={() => setShowRateHelp(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
          {showFreqHelp && (
            <div className="popup-overlay" onClick={() => setShowFreqHelp(false)}>
              <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <h4>What is Compounding Frequency?</h4>
                <p>
                  The Compounding Frequency indicates how many times per year your interest is compounded.
                  For example, a frequency of 12 means the interest is compounded monthly.
                </p>
                <button className="close-button" onClick={() => setShowFreqHelp(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;

