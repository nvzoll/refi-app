import React, { useEffect, useMemo } from "react";
import quotes from "./quotes.json";
import firebaseLogo from "./firebase-logo.svg";

const LOADING_DELAY_MS = 5000;

interface IQuote {
  text: string;
  author: string;
  url?: string;
}

interface IQuoteLoadingProps {
  onDone: () => void;
}

const QuoteLoading = ({ onDone }: IQuoteLoadingProps) => {
  const quote: IQuote | undefined = useMemo(
    () => quotes[Math.floor(Math.random() * quotes.length)],
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, LOADING_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen text-center quote">
      <div className="animate-spin">
        <svg
          width="36"
          height="36"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          className="text-gray-600"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.917 7A6.002 6.002 0 0 0 2.083 7H1.071a7.002 7.002 0 0 1 13.858 0h-1.012z"
          />
        </svg>
      </div>
      {quote && (
        <>
          <p className="mt-3 text-3xl italic text-gray-500 mx-72">
            {quote.text}
          </p>
          {quote.url && (
            <p>
              <a className="text-lg text-blue-500" href={quote.url}>
                Learn more
              </a>
            </p>
          )}
          <img
            className="w-12 h-12 mt-6 rounded-lg"
            src={firebaseLogo}
            alt="Firebase"
          />
          <div className="flex flex-row items-center">
            <div className="text-2xl">{quote.author}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuoteLoading;
