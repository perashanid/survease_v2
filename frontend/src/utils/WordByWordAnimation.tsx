import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WordByWordAnimationProps {
  text: string;
  delay?: number;
  wordDelay?: number;
  className?: string;
}

export const WordByWordAnimation: React.FC<WordByWordAnimationProps> = ({
  text,
  delay = 0,
  wordDelay = 80,
  className = ''
}) => {
  const [visibleWords, setVisibleWords] = useState<number>(0);
  const words = text.split(' ');

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setVisibleWords((prev) => {
          if (prev >= words.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, wordDelay);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(initialTimer);
  }, [words.length, wordDelay, delay]);

  return (
    <span className={className}>
      <AnimatePresence>
        {words.map((word, index) => (
          index < visibleWords && (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ display: 'inline-block', marginRight: '0.3em' }}
            >
              {word}
            </motion.span>
          )
        ))}
      </AnimatePresence>
    </span>
  );
};

interface TypewriterAnimationProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  showCursor?: boolean;
}

export const TypewriterAnimation: React.FC<TypewriterAnimationProps> = ({
  text,
  speed = 50,
  delay = 0,
  className = '',
  showCursor = true
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayText((prev) => prev + text[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        }, speed);

        return () => clearTimeout(timer);
      } else {
        setIsComplete(true);
      }
    }, delay);

    return () => clearTimeout(initialTimer);
  }, [currentIndex, text, speed, delay]);

  return (
    <span className={className}>
      {displayText}
      {showCursor && !isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
          style={{ display: 'inline-block', marginLeft: '2px' }}
        >
          |
        </motion.span>
      )}
    </span>
  );
};

interface StaggeredTextProps {
  text: string;
  delay?: number;
  staggerDelay?: number;
  className?: string;
}

export const StaggeredText: React.FC<StaggeredTextProps> = ({
  text,
  delay = 0,
  staggerDelay = 30,
  className = ''
}) => {
  const letters = text.split('');

  return (
    <span className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: delay + (index * staggerDelay) / 1000,
            ease: 'easeOut'
          }}
          style={{ display: 'inline-block' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  );
};

interface FadeInParagraphProps {
  text: string;
  delay?: number;
  className?: string;
}

export const FadeInParagraph: React.FC<FadeInParagraphProps> = ({
  text,
  delay = 0,
  className = ''
}) => {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {text}
    </motion.p>
  );
};
