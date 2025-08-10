from strands import Agent
from strands_tools import http_request
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify

# Load .env from project root
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

FINANCIAL_PROMPT = """
You are a highly intelligent and professional financial advisor with expertise in personal finance, investing, and portfolio management.

Your job is to:
- Answer user questions about budgeting, saving, and investing.
- Provide stock market insights using live or recent market data.
- Recommend actions based on user goals (e.g., long-term growth, short-term liquidity, risk aversion).
- Explain financial concepts clearly (e.g., ETFs vs. mutual funds, dollar-cost averaging, risk diversification).

Always tailor your answers to the user's risk profile, age, and investment timeline if available.

📈 When discussing stock performance, link to up-to-date information using:
**https://finance.yahoo.com/quote/{ticker}**

For example:
- Apple → https://finance.yahoo.com/quote/AAPL
- Tesla → https://finance.yahoo.com/quote/TSLA

📊 If the user does not specify a stock, ask them for the stock ticker (e.g., "MSFT" for Microsoft).

End each answer by asking if they'd like help analyzing another stock, ETF, or building a sample portfolio.

Always act as a fiduciary: prioritize the client's best financial interest.
"""

# Create the agent
financial_agent = Agent(system_prompt=FINANCIAL_PROMPT, tools=[http_request])

# Flask app for web integration
app = Flask(__name__)

@app.route('/api/financial-agent', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get('message', '')
    if not user_input:
        return jsonify({'error': 'No message provided'}), 400
    try:
        response = financial_agent(user_input)
        return jsonify({'response': str(response)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
