/*
 * File: RegexUtil.ts
 * Project: ts-util
 * File Created: Sunday, 1st September 2019 2:03:50 pm
 * Author: freedomsean (t101598009@ntut.org)
 * -----
 * Last Modified: Sunday, 1st September 2019 4:20:54 pm
 * Modified By: freedomsean (t101598009@ntut.org>)
 * -----
 * This file can be used in the commercial or personal purpose.
 * If you want to use this, please send a message for me and keep the information in the header.
 */

export class RegexUtil {
  /**
   * To get the value of the match part in Regex
   * @param regex
   * @param str
   * @param tokenCount how many token you used
   */
  static getMatchPartVal(regex: RegExp, str: string, tokenCount: number = 1): string[] {
    const matches: string[] = [];
    if (typeof str !== "string" || str.length === 0) {
      return matches;
    }

    let matchRegex = regex.exec(str);

    while (matchRegex !== null) {
      for (let i = 1; i <= tokenCount; i++) {
        matches.push(matchRegex[i]);
      }
      matchRegex = regex.exec(str);
    }

    return matches;
  }
}