import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DiceGame = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [balance, setBalance] = useState(() => {
    const savedBalance = localStorage.getItem('diceGameBalance');
    return savedBalance ? Number(savedBalance) : 1000;
  });
  const [betAmount, setBetAmount] = useState('');
  const [diceRoll, setDiceRoll] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [multiplier, setMultiplier] = useState(1);

  useEffect(() => {
    localStorage.setItem('diceGameBalance', balance.toString());
  }, [balance]);

  useEffect(() => {
    const verifyBalance = async () => {
      try {
        const response = await axios.post(API_BASE_URL, {
          currentBalance: balance
        });
        
        if (response.data.balance !== balance) {
          setBalance(response.data.balance);
        }
      } catch (error) {
        console.error('Balance verification failed', error);
        const savedBalance = localStorage.getItem('diceGameBalance');
        if (savedBalance) {
          setBalance(Number(savedBalance));
        }
      }
    };

    verifyBalance();
  }, []);

  const handleBetAmountChange = (e) => {
    const value = e.target.value;
    
    if (value === '' || /^\d*$/.test(value)) {
      const numValue = value === '' ? 0 : Number(value);
      
      if (numValue <= balance) {
        setBetAmount(value);
      }
    }
  };

  const handleQuickBet = (percentage) => {
    const quickBetAmount = Math.floor(balance * percentage);
    setBetAmount(quickBetAmount.toString());
  };

  const handleMultiplierChange = (mult) => {
    setMultiplier(mult);
  };

  const handleRollDice = async () => {
    const numBetAmount = betAmount === '' ? 0 : Number(betAmount);

    if (numBetAmount <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }
    if (numBetAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsRolling(true);
    setDiceRoll(null);

    try {
      const response = await axios.post('http://localhost:5000/roll-dice', {
        betAmount: numBetAmount,
        multiplier
      });

      const { roll, isWin, newBalance, potentialWinnings } = response.data;

      setDiceRoll(roll);
      setBalance(newBalance);
      
      if (newBalance === 0) {
        setBetAmount('');
      }

      if (isWin) {
        toast.success(`You won! Rolled a ${roll}. Won $${potentialWinnings.toFixed(2)}`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error(`You lost! Rolled a ${roll}. Lost $${(numBetAmount * multiplier).toFixed(2)}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error('Error rolling dice');
      console.error(error);
    }

    setIsRolling(false);
  };

  const handleResetBalance = async () => {
    try {
      const response = await axios.post('http://localhost:5000/reset-balance');
      const newBalance = response.data.balance;
      setBalance(newBalance);
      setBetAmount('');
      toast.success(`Balance reset to $${newBalance}!`);
    } catch (error) {
      toast.error('Failed to reset balance');
      console.error(error);
    }
  };

  const renderDiceFace = () => {
    if (diceRoll === null) return null;
    
    const diceFaces = {
      1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
    };

    return (
      <div className="text-8xl text-white mt-4 text-center">
        {diceFaces[diceRoll]}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <ToastContainer theme="dark" />
      
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border-4 border-gray-700">
        {/* display balance */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={handleResetBalance}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
          >
            Reset Balance
          </button>
          <span className="text-green-400 font-bold text-3xl">
            ${balance.toFixed(2)}
          </span>
        </div>

        {/* amount bet input */}
        <div className="mb-6">
          <input
            type="text"
            value={betAmount}
            onChange={handleBetAmountChange}
            placeholder="Enter bet amount"
            className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-between mt-3 space-x-2">
            {[0.25, 0.5, 0.75, 1].map((percentage) => (
              <button 
                key={percentage}
                onClick={() => handleQuickBet(percentage)} 
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded-lg transition duration-300 ease-in-out"
              >
                {percentage === 1 ? 'Max' : `${percentage * 100}%`}
              </button>
            ))}
          </div>
        </div>

        {/* select multiplier */}
        <div className="mb-6">
          <div className="flex justify-between space-x-2">
            {[1, 2, 3].map((mult) => (
              <button 
                key={mult}
                onClick={() => handleMultiplierChange(mult)}
                className={`flex-1 px-4 py-3 rounded-lg transition duration-300 ease-in-out ${
                  multiplier === mult 
                    ? 'bg-indigo-600 text-white scale-105' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

        {/* roll dice */}
        <button 
          onClick={handleRollDice}
          disabled={isRolling || betAmount === ''}
          className={`w-full py-4 rounded-lg mt-4 text-lg font-bold uppercase tracking-wider transition duration-300 ease-in-out ${
            isRolling || betAmount === '' 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 transform hover:scale-105 shadow-lg'
          }`}
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>

        {/* display the Dice */}
        {renderDiceFace()}
      </div>
    </div>
  );
};

export default DiceGame;