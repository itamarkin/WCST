// Stimulus cards, rule sequence, and response deck definitions for the WCST.
// Based on the Heaton et al. (1993) standard 64-card deck.

import type { Card, Dimension } from "./wcstTypes";

// The four fixed stimulus (key) cards displayed across the top.
export const STIMULUS_CARDS: Card[] = [
  { id: 0, color: "red", shape: "triangle", number: 1 },
  { id: 1, color: "green", shape: "star", number: 2 },
  { id: 2, color: "yellow", shape: "cross", number: 3 },
  { id: 3, color: "blue", shape: "circle", number: 4 },
];

// Color -> Shape -> Number, repeating. A category completes every 10
// consecutive correct responses, advancing to the next entry in this list.
export const RULE_SEQUENCE: Dimension[] = [
  "color",
  "shape",
  "number",
  "color",
  "shape",
  "number",
];

export const CONSECUTIVE_CRITERION = 10;
export const MAX_CATEGORIES = 6;
export const MAX_CARDS = 128;

// The standard 64-card WCST deck. Administered twice to reach 128 cards.
const STANDARD_DECK: Card[] = [
  { id: "deck1-0", color: "green", shape: "triangle", number: 1 },
  { id: "deck1-1", color: "red", shape: "cross", number: 4 },
  { id: "deck1-2", color: "blue", shape: "triangle", number: 2 },
  { id: "deck1-3", color: "yellow", shape: "star", number: 3 },
  { id: "deck1-4", color: "red", shape: "triangle", number: 3 },
  { id: "deck1-5", color: "green", shape: "cross", number: 2 },
  { id: "deck1-6", color: "blue", shape: "star", number: 1 },
  { id: "deck1-7", color: "yellow", shape: "circle", number: 4 },
  { id: "deck1-8", color: "red", shape: "star", number: 2 },
  { id: "deck1-9", color: "green", shape: "circle", number: 3 },
  { id: "deck1-10", color: "blue", shape: "cross", number: 4 },
  { id: "deck1-11", color: "yellow", shape: "triangle", number: 1 },
  { id: "deck1-12", color: "red", shape: "circle", number: 1 },
  { id: "deck1-13", color: "green", shape: "star", number: 4 },
  { id: "deck1-14", color: "blue", shape: "circle", number: 3 },
  { id: "deck1-15", color: "yellow", shape: "cross", number: 2 },
  { id: "deck1-16", color: "red", shape: "triangle", number: 4 },
  { id: "deck1-17", color: "green", shape: "cross", number: 1 },
  { id: "deck1-18", color: "blue", shape: "star", number: 2 },
  { id: "deck1-19", color: "yellow", shape: "circle", number: 3 },
  { id: "deck1-20", color: "red", shape: "star", number: 3 },
  { id: "deck1-21", color: "green", shape: "circle", number: 4 },
  { id: "deck1-22", color: "blue", shape: "cross", number: 1 },
  { id: "deck1-23", color: "yellow", shape: "triangle", number: 2 },
  { id: "deck1-24", color: "red", shape: "cross", number: 2 },
  { id: "deck1-25", color: "green", shape: "triangle", number: 3 },
  { id: "deck1-26", color: "blue", shape: "star", number: 4 },
  { id: "deck1-27", color: "yellow", shape: "circle", number: 1 },
  { id: "deck1-28", color: "red", shape: "circle", number: 3 },
  { id: "deck1-29", color: "green", shape: "star", number: 1 },
  { id: "deck1-30", color: "blue", shape: "triangle", number: 4 },
  { id: "deck1-31", color: "yellow", shape: "cross", number: 2 },
  { id: "deck1-32", color: "red", shape: "star", number: 1 },
  { id: "deck1-33", color: "green", shape: "cross", number: 4 },
  { id: "deck1-34", color: "blue", shape: "circle", number: 2 },
  { id: "deck1-35", color: "yellow", shape: "triangle", number: 3 },
  { id: "deck1-36", color: "red", shape: "triangle", number: 2 },
  { id: "deck1-37", color: "green", shape: "circle", number: 1 },
  { id: "deck1-38", color: "blue", shape: "cross", number: 3 },
  { id: "deck1-39", color: "yellow", shape: "star", number: 4 },
  { id: "deck1-40", color: "red", shape: "cross", number: 3 },
  { id: "deck1-41", color: "green", shape: "triangle", number: 4 },
  { id: "deck1-42", color: "blue", shape: "star", number: 1 },
  { id: "deck1-43", color: "yellow", shape: "circle", number: 2 },
  { id: "deck1-44", color: "red", shape: "circle", number: 4 },
  { id: "deck1-45", color: "green", shape: "star", number: 3 },
  { id: "deck1-46", color: "blue", shape: "triangle", number: 1 },
  { id: "deck1-47", color: "yellow", shape: "cross", number: 2 },
  { id: "deck1-48", color: "red", shape: "star", number: 4 },
  { id: "deck1-49", color: "green", shape: "cross", number: 2 },
  { id: "deck1-50", color: "blue", shape: "circle", number: 1 },
  { id: "deck1-51", color: "yellow", shape: "triangle", number: 3 },
  { id: "deck1-52", color: "red", shape: "triangle", number: 1 },
  { id: "deck1-53", color: "green", shape: "circle", number: 2 },
  { id: "deck1-54", color: "blue", shape: "cross", number: 4 },
  { id: "deck1-55", color: "yellow", shape: "star", number: 3 },
  { id: "deck1-56", color: "red", shape: "cross", number: 1 },
  { id: "deck1-57", color: "green", shape: "triangle", number: 4 },
  { id: "deck1-58", color: "blue", shape: "star", number: 3 },
  { id: "deck1-59", color: "yellow", shape: "circle", number: 2 },
  { id: "deck1-60", color: "red", shape: "circle", number: 2 },
  { id: "deck1-61", color: "green", shape: "star", number: 1 },
  { id: "deck1-62", color: "blue", shape: "triangle", number: 3 },
  { id: "deck1-63", color: "green", shape: "cross", number: 1 },
];

// Build the 128-card deck by concatenating two standard decks with unique ids.
export function createResponseDeck(): Card[] {
  const secondDeck = STANDARD_DECK.map((card) => ({
    ...card,
    id: String(card.id).replace("deck1-", "deck2-"),
  }));
  return [...STANDARD_DECK, ...secondDeck];
}

// Compute which dimensions a response card matches against a given stimulus.
export function getMatchingDimensions(
  responseCard: Card,
  stimulus: Card
): Dimension[] {
  const matches: Dimension[] = [];
  if (responseCard.color === stimulus.color) matches.push("color");
  if (responseCard.shape === stimulus.shape) matches.push("shape");
  if (responseCard.number === stimulus.number) matches.push("number");
  return matches;
}
