import { green, red, blue, bold, underline } from "colorette";
import pageConfig from "../blocks";
import type { WordpressBlockTemplate } from "./WordpressBlocks";
import { createBlockFiles } from "./ThemeCreator";

// disable ssl
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

class WordpressManager {
    public graphqlUrl: string | null = null;
    public cmsData: any;

    async init(graphqlUrl: string, registeredBlocks: Array<WordpressBlockTemplate>): Promise<any> {
        this.graphqlUrl = graphqlUrl;
        this.cmsData = await this.fetchData(registeredBlocks);
    }

    async GetGQL(Query: string) {
        try {
            const gqlurl = this.graphqlUrl as string;
            const response = await fetch(gqlurl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: Query,
                    variables: {},
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const json = await response.json();
            return json.data;
        } catch (error) {
            console.error("Error fetching GraphQL data:", error);
            return null; // or handle the error as needed
        }
    }

    async fetchData(registeredBlocks: Array<WordpressBlockTemplate>) {
        try {
            let data = await this.GetGQL(pageConfig.gqlQueryGenerator(this.buildGQLBlockAttributes(registeredBlocks)));
            if (!data) {
                // minimal gql query
                data = await this.GetGQL(pageConfig.gqlQueryGenerator(this.buildGQLBlockAttributes([])));

                if (data) {
                    console.error(red("Blocks are outdated. Generating block files..."));
                    await createBlockFiles();
                    console.log(red("Please upload the generated block files to your CMS."));
                } else {
                    throw new Error("CMS Fetch Error. Minimal query failed.");
                }
            }
            if (data && data.pages && data.pages.nodes) {
                data.pages.nodes.forEach((node: any) => {
                    // Loop through each editorBlock
                    if (node.editorBlocks) {
                        node.editorBlocks.forEach((block: any) => {
                            // Check if the block has a data attribute
                            if (block.attributes && block.attributes.data) {
                                try {
                                    // Parse the JSON string into an object
                                    block.attributes.data = JSON.parse(block.attributes.data);
                                } catch (e) {
                                    console.error("Error parsing block data as JSON:", e);
                                }
                            }
                        });
                    }
                });
            }
            if (process.env.NODE_ENV !== "production") {
                console.log(green("Fetched data from CMS"));
            }
            // console.log(JSON.stringify(data, null, 2));
            return data;
        } catch (error) {
            throw error;
        }
    }

    buildGQLBlockAttributes(registeredBlocks: Array<WordpressBlockTemplate>) {
        if (!registeredBlocks || registeredBlocks.length === 0) return null;
        let gqlBlockAttributes = "";
        for (const block of registeredBlocks) {
            // if not exactly 2 uppercase letters or contains a /, throw an error
            if (this.countUpperCaseLetters(block.gqlqueryname) !== 2) {
                throw new Error(red(`gqlqueryname '${block.gqlqueryname}' must have exactly 2 uppercase letters`));
            } else if (block.gqlqueryname.includes("/")) {
                throw new Error(red(`gqlqueryname '${block.gqlqueryname}' cannot contain a '/'`));
            }
            gqlBlockAttributes += `
            ... on ${block.gqlqueryname} {
                apiVersion
                attributes {
                    data
                  }
                }
            `;
        }
        // console.log(green("GQL Block Attributes:"));
        // console.log(gqlBlockAttributes);
        return gqlBlockAttributes;
    }

    countUpperCaseLetters(input: string): number {
        let count = 0;
        // Iterate through each character in the string
        for (let i = 0; i < input.length; i++) {
            // Check if the character is an uppercase letter
            if (input[i] >= "A" && input[i] <= "Z") {
                count++;
            }
        }
        return count;
    }
}
let wpManagerInstance = new WordpressManager();
await wpManagerInstance.init(pageConfig.graphqlUrl, pageConfig.registeredBlocks);

export { wpManagerInstance, WordpressManager };
