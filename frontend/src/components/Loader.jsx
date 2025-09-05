// src/components/Loader.jsx
import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

const Loader = () => {
  return (
    <StyledWrapper>
      <motion.div
        className="loader"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div data-glitch="Loading..." className="glitch">
          Loading...
        </div>
      </motion.div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;

  .glitch {
    position: relative;
    font-size: 28px;
    font-weight: 800;
    line-height: 1.2;
    color: #fff;
    letter-spacing: 5px;
    z-index: 1;
    animation: shift 1s ease-in-out infinite alternate;
    text-transform: uppercase;
  }

  .glitch:before,
  .glitch:after {
    display: block;
    content: attr(data-glitch);
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0.8;
  }

  .glitch:before {
    animation: glitch 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite;
    color: #8b00ff;
    z-index: -1;
  }

  .glitch:after {
    animation: glitch 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse both infinite;
    color: #00e571;
    z-index: -2;
  }

  @keyframes glitch {
    0% {
      transform: translate(0);
    }
    20% {
      transform: translate(-3px, 3px);
    }
    40% {
      transform: translate(-3px, -3px);
    }
    60% {
      transform: translate(3px, 3px);
    }
    80% {
      transform: translate(3px, -3px);
    }
    to {
      transform: translate(0);
    }
  }

  @keyframes shift {
    0%, 40%, 44%, 58%, 61%, 65%, 69%, 73%, 100% {
      transform: skewX(0deg);
    }
    41% {
      transform: skewX(10deg);
    }
    42% {
      transform: skewX(-10deg);
    }
    59% {
      transform: skewX(40deg) skewY(10deg);
    }
    60% {
      transform: skewX(-40deg) skewY(-10deg);
    }
    63% {
      transform: skewX(10deg) skewY(-5deg);
    }
    70% {
      transform: skewX(-50deg) skewY(-20deg);
    }
    71% {
      transform: skewX(10deg) skewY(-10deg);
    }
  }
`;

export default Loader;
