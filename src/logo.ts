import { Palette } from "./theme";

const PERCENT_LOGO = [
  "%%%%%        %%%%%        %%%%%  ",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  " %%%%%%%      %%%%%%%%     %%%%%%%%",
  "  %%%%%        %%%%%        %%%%%  ",
  "                                   ",
  "                                   ",
  " %%%%%%%       %%%%%%      %%%%%%% ",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "  %%%%%        %%%%%        %%%%%  ",
  "                                   ",
  "                                   ",
  "  %%%%%        %%%%%        %%%%%  ",
  " %%%%%%%     %%%%%%%%%     %%%%%%%%",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "%%%%%%%%%    %%%%%%%%%    %%%%%%%%%",
  "  %%%%%       %%%%%%%       %%%%%  ",
];

export function renderLogo(palette: Palette): string[] {
  return PERCENT_LOGO.map((line) => {
    if (!palette.enabled) {
      return line;
    }

    let rendered = "";
    for (const char of line) {
      if (char === "%") {
        rendered += palette.logo(char);
      } else {
        rendered += char;
      }
    }
    return rendered;
  });
}
