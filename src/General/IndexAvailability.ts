import { Conf, g } from "../globals/globals";

export function indexEnabledOn({ siteID, boardID }: { siteID: string, boardID: string }): boolean {
  return Conf["JSON Index"] && (g.sites[siteID].software === "yotsuba") && (boardID !== "f");
}
