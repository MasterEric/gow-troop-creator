import React, { useEffect, useRef, useState } from "react";
import { Layer, Group } from "react-konva";
import Konva from "konva";
import debounceRender from "react-debounce-render";

import {
  CardBase,
  CardImage,
  CardText,
  CardTextRef,
  CardMultiStyleText,
  CardImageRotating
} from "./CardBase";

// Create a text element that scales to always be one line.
const CardSpellNameText = ({
  text,
  width,
  x,
  y,
  horizontalAlign = "center",
  fontWeight,
  baseFontSize,
  fontsLoaded
}) => {
  const textRef = useRef(null);

  // Create a basic state that resets when the troop changes.
  const [state, setState] = useState({ stable: false, fontSize: baseFontSize });
  useEffect(() => {
    setState({ stable: false, fontSize: baseFontSize });
  }, [text, baseFontSize]);

  // Modify the font size until it's right.
  useEffect(() => {
    if (!state.stable && textRef.current !== null) {
      if (textRef.current.textArr.length > 1) {
        setState(oldState => ({
          ...oldState,
          fontSize: oldState.fontSize - 2
        }));
      } else {
        // Finalize the state.
        setState(oldState => ({ ...oldState, stable: true }));
      }
    }
  }, [state]);

  // Display either the proper text or a loading icon.
  const result = state.stable ? (
    <CardTextRef
      ref={textRef}
      x={x}
      y={y}
      height={baseFontSize}
      width={width}
      horizontalAlign={horizontalAlign}
      verticalAlign="middle"
      text={text}
      fontWeight={fontWeight}
      fontSize={state.fontSize}
      fontsLoaded={fontsLoaded}
    />
  ) : (
    <Group>
      <CardTextRef
        ref={textRef}
        x={x}
        y={0}
        height={1000}
        width={width}
        horizontalAlign={horizontalAlign}
        verticalAlign="middle"
        text={text}
        opacity={0}
        fontWeight={fontWeight}
        fontSize={state.fontSize}
        fontsLoaded={fontsLoaded}
      />
      <CardImageRotating
        base="./graphics/troop/loading"
        x={195}
        y={323}
        width={100}
        height={100}
      />
    </Group>
  );

  return result;
};

/*
 * BEWARE, ALL YE WHO ENTER HERE
 * This creates multiple text elements in order to create multi-styled text.
 */
const CardSpellDescText = ({
  troop,
  yCenter,
  cardWidth,
  innerWidth,
  height,
  baseFontSize,
  fontFamily = "Open Sans",
  fontWeight = 600,
  color = "#000",
  magicFontWeight,
  magicColor,
  fontsLoaded
}) => {
  // A reference to the hidden text display used for math.
  const baseDisplayRef = useRef(null);

  // Create a basic state that resets when the troop changes.
  const [state, setState] = useState({ stable: false, fontSize: baseFontSize });
  useEffect(() => {
    setState({ stable: false, fontSize: baseFontSize });
  }, [troop, baseFontSize]);

  // Modify the font size until it's right.
  useEffect(() => {
    if (!state.stable && baseDisplayRef.current !== null) {
      if (baseDisplayRef.current.textArr.length * state.fontSize > height) {
        setState(oldState => ({
          ...oldState,
          fontSize: oldState.fontSize - 3
        }));
      } else {
        // Finalize the state.
        setState(oldState => ({ ...oldState, stable: true }));
      }
    }
  }, [state, height]);

  // Outputs either a magic value or a range, as appropriate.
  const calculateMagicText = () => {
    const magicDamage =
      parseInt(troop.spellbase, 10) +
      parseInt(troop.spellmult, 10) * parseInt(troop.magic, 10);
    return troop.spellrange
      ? `${Math.floor(magicDamage / 2)} - ${magicDamage}`
      : magicDamage.toString();
  };

  // This simple substitution is only used for the baseDisplay.
  const simpleDescSub = () =>
    troop.spelldesc.replace(/{magic}/gi, calculateMagicText());

  const calculateMagicPhrases = phrase =>
    calculateMagicText()
      .split(/(\s+)/)
      .map(word => {
        return word === "-"
          ? { ...phrase, text: word }
          : {
              ...phrase,
              color: magicColor,
              text: word,
              weight: magicFontWeight
            };
      });

  // Turn the current text into a MultiStyleText descriptor.
  const splitSpellDesc = () => {
    const result = [];
    // Split the spell description.
    troop.spelldesc.split(/(\s+)/).forEach(word => {
      const phrase = {
        text: word,
        weight: fontWeight,
        size: state.fontSize,
        family: fontFamily,
        color
      };
      if (/\{magic\}/gi.test(word)) {
        // Resolve the magic phrase into either a number or range.
        result.push(...calculateMagicPhrases(phrase));
      } else {
        // Else, don't use magic.
        result.push(phrase);
      }
    });

    // Find the length of each line by checking the invisible baseDisplay.
    const lineLengths = baseDisplayRef.current.textArr.map(value => {
      return value.text.split(/(\s+)/).length;
    });

    // Get the indexes of each line.
    const lineIndexes = [0];
    lineLengths.forEach(lineLength =>
      lineIndexes.push(lineLength + lineIndexes[lineIndexes.length - 1] + 1)
    );
    lineIndexes.pop();

    // Split the phrase array by index + length.
    const lines = lineIndexes.map((lineIndex, position) => {
      return result.slice(lineIndex, lineIndex + lineLengths[position]);
    });

    return lines;
  };

  // The invisible text is used to calculate line heights.
  const baseDisplay = (
    <CardTextRef
      ref={baseDisplayRef}
      x={(cardWidth - innerWidth) / 2}
      y={0}
      width={innerWidth}
      color={color}
      height={1000}
      opacity={0}
      fontsLoaded={fontsLoaded}
      fontSize={state.fontSize}
      fontWeight={fontWeight}
      text={simpleDescSub()}
      horizontalAlign="center"
      verticalAlign="middle"
    />
  );

  /*
   * If stable, display multi-styled text.
   * Else, display a loading image.
   */
  return state.stable ? (
    <Group>
      {baseDisplay}
      <CardMultiStyleText
        fontsLoaded={fontsLoaded}
        textArray={splitSpellDesc()}
        yCenter={yCenter}
        xCenter={cardWidth / 2}
      />
    </Group>
  ) : (
    <Group>
      {baseDisplay}
      <CardImageRotating
        src="./graphics/troop/loading"
        x={195}
        y={323}
        width={100}
        height={100}
      />
    </Group>
  );
};

const CardSpell = debounceRender(({ troop, displayLayer, fontsLoaded }) => {
  const loadingLayer = useRef(null);

  // Hide while loading.
  useEffect(() => {
    displayLayer.current.loaded = false;
    loadingLayer.current.show();
    displayLayer.current.hide();
    loadingLayer.current.draw();
  }, []);

  // Show once loaded.
  useEffect(() => {
    if (fontsLoaded && displayLayer.current.loaded) {
      loadingLayer.current.hide();
      displayLayer.current.show();
      displayLayer.current.draw();
    }
  }, [fontsLoaded, (displayLayer.current || { loaded: false }).loaded]);

  // Loading animation.
  useEffect(() => {
    const anim = new Konva.Animation(frame => {
      const angleDiff = (frame.timeDiff * 120) / 1000;
      loadingLayer.current.rotate(angleDiff);
    }, loadingLayer.current);
    anim.start();
  }, [loadingLayer]);

  return (
    <CardBase width={460} height={723}>
      <Layer ref={loadingLayer}>
        <CardImageRotating
          src="./graphics/troop/loading"
          x={195}
          y={323}
          width={100}
          height={100}
          angularRate={90}
        />
      </Layer>
      <Layer ref={displayLayer}>
        <CardImage
          url={troop.spellimage}
          base="./graphics/troop/eruption"
          x={0}
          y={87}
          width={460}
          height={340}
        />
        <CardImage
          base={
            troop.rarity !== "" ? `./graphics/spellcard/${troop.rarity}` : null
          }
          width={460}
          height={723}
          onLoad={() => {
            displayLayer.current.loaded = true;
          }}
        />
        <CardSpellNameText
          x={70}
          y={30}
          width={320}
          horizontalAlign="center"
          text={troop.spellname}
          fontWeight={600}
          baseFontSize={50}
          fontsLoaded={fontsLoaded}
        />
        <CardText
          x={235}
          y={457}
          width={80}
          horizontalAlign="left"
          text={troop.magic}
          fontWeight={600}
          fontSize={40}
          fontsLoaded={fontsLoaded}
        />
        <CardSpellDescText
          troop={troop}
          yCenter={600}
          innerWidth={425}
          cardWidth={460}
          height={160}
          fontWeight={600}
          baseFontSize={38}
          color="#000"
          magicColor="#680b7c"
          magicFontWeight="800"
          fontsLoaded={fontsLoaded}
        />
      </Layer>
    </CardBase>
  );
}, 300);

export default CardSpell;
