import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import { FALLBACK_SOCIAL_ICON, SOCIAL_ICONS } from "@/lib/icons";
import SocialIcon from "./SocialIcon.astro";

describe("SocialIcon", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: { network: string; size?: number; style?: string }) =>
    container.renderToString(SocialIcon, { props });

  it("renders the registry icon of a known network", async () => {
    const html = await render({ network: "GitHub" });
    expect(html).toContain(SOCIAL_ICONS.GitHub.paths[0]);
    expect(html).toContain("<title>GitHub</title>");
  });

  it("renders the fallback icon for an unknown network, never 'undefined'", async () => {
    const html = await render({ network: "Mastodon" });
    expect(html).toContain(FALLBACK_SOCIAL_ICON.paths[0]);
    expect(html).toContain("<title>Mastodon</title>");
    expect(html).not.toContain("undefined");
  });

  it("forwards size and style to the svg", async () => {
    const html = await render({
      network: "X",
      size: 24,
      style: "margin-right: 8px",
    });
    expect(html).toContain('width="24"');
    expect(html).toContain('style="margin-right: 8px"');
  });
});
