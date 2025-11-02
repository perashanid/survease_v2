import React, { useEffect, useState } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export const Typewriter: React.FC<TypewriterProps> = ({ 
  text, 
  speed = 50, 
  delay = 0,
  onComplete 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, speed);
        return () => clearTimeout(timer);
      } else if (onComplete) {
        onComplete();
      }
    }, delay);

    return () => clearTimeout(startTimer);
  }, [currentIndex, text, speed, delay, onComplete]);

  return <>{displayText}</>;
};

interface WordByWordProps {
  text: string;
  delay?: number;
  wordDelay?: number;
  className?: string;
}

export const WordByWord: React.FC<WordByWordProps> = ({ 
  text, 
  delay = 0, 
  wordDelay = 100,
  className = ''
}) => {
  const [visibleWords, setVisibleWords] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    const startTimer = setTimeout(() => {
      if (visibleWords < words.length) {
        const timer = setTimeout(() => {
          setVisibleWords(prev => prev + 1);
        }, wordDelay);
        return () => clearTimeout(timer);
      }
    }, delay);

    return () => clearTimeout(startTimer);
  }, [visibleWords, words.length, wordDelay, delay]);

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span
          key={index}
          className="word-animation"
          style={{
            animationDelay: `${index * (wordDelay / 1000)}s`,
            opacity: index < visibleWords ? 1 : 0
          }}
        >
          {word}{index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
};

interface FadeInTextProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeInText: React.FC<FadeInTextProps> = ({ 
  text, 
  delay = 0, 
  duration = 600,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <span
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`
      }}
    >
      {text}
    </span>
  );
};
