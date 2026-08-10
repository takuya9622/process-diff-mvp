if (process.env.CONFIRM_PRODUCTION_DATA_APPLY !== "true") {
  throw new Error(
    "Set CONFIRM_PRODUCTION_DATA_APPLY=true only after confirming the Production database target.",
  );
}

console.log("Production database target confirmed.");
