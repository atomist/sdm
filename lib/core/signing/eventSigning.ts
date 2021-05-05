import { GraphClientListener } from "@atomist/automation-client/lib/graph/ApolloGraphClient";
import { HandleEvent } from "@atomist/automation-client/lib/HandleEvent";
import { metadataFromInstance } from "@atomist/automation-client/lib/internal/metadata/metadataReading";
import { EventHandlerMetadata } from "@atomist/automation-client/lib/metadata/automationMetadata";
import {
	Maker,
	toFactory,
} from "@atomist/automation-client/lib/util/constructionUtils";
import { MutationOptions } from "@atomist/automation-client/src/lib/spi/graph/GraphClient";
import * as crypto from "crypto";
import { EventSigningConfiguration } from "../../api/machine/SigningKeys";
import { toArray } from "../util/misc/array";

export class EventSigningAutomationEventListener implements GraphClientListener<any> {

	constructor(private readonly esc: EventSigningConfiguration) {
		this.initVerificationKeys();
	}

	public async onMutation(options: MutationOptions<any>): Promise<MutationOptions<any>> {

		if (eventMatch(options.name, this.esc.events)) {
			const privateKey = crypto.createPrivateKey({
				key: this.esc.signingKey.privateKey,
				passphrase: this.esc.signingKey.passphrase,
			});
			const { default: CompactSign } = require("jose/jws/compact/sign");
			for (const key in Object.getOwnPropertyNames(options.variables || {})) {
				const value = options.variables[key];
				const jws = await new CompactSign(Buffer.from(JSON.stringify(value)))
					.setProtectedHeader({ alg: "ES512" })
					.sign(privateKey);
				value.signature = jws;
			}
		}

		return options;
	}

	private initVerificationKeys(): void {
		this.esc.verificationKeys = toArray(this.esc.verificationKeys) || [];

		// If signing key is set, also use it to verify
		if (!!this.esc.signingKey) {
			this.esc.verificationKeys.push(this.esc.signingKey);
		}
	}
}

export function wrapEventHandlersToVerifySignature(handlers: Array<Maker<HandleEvent<any>>>,
                                                   options: EventSigningConfiguration): Array<Maker<HandleEvent<any>>> {
	const wh: Array<Maker<HandleEvent<any>>> = [];
	for (const handler of handlers) {
		const instance = toFactory(handler)();
		const md = metadataFromInstance(instance) as EventHandlerMetadata;
		if (eventMatch(md.subscriptionName, options.events)) {
			wh.push(() => ({
				...md,
				handle: async (e, ctx, params) => {
					const { default: compactVerify } = require("jose/jws/compact/verify");
					for (const key of Object.getOwnPropertyNames(e.data)) {
						const evv = e.data[key][0];
						if (!evv.signature) {
							throw new Error("Signature missing on incoming event");
						}
						let verified = false;
						for (const pkey of toArray(options.verificationKeys)) {
							const publicKey = crypto.createPublicKey({
								key: pkey.publicKey,
							});
							try {
								const { payload } = await compactVerify(evv.signature, publicKey);
								e.data[key][0] = JSON.parse(Buffer.from(payload).toString());
								verified = true;
							} catch (e) {
								// return undefined;
							}
						}
						if (!verified) {
							throw new Error("Signature verification failed for incoming event");
						}
					}

					return instance.handle(e, ctx, params);
				},
			}));
		} else {
			wh.push(handler);
		}
	}

	return wh;
}

function eventMatch(event: string, patterns: string[]): boolean {
	for (const pattern of patterns) {
		if (new RegExp(pattern).test(event)) {
			return true;
		}
	}
	return false;
}
