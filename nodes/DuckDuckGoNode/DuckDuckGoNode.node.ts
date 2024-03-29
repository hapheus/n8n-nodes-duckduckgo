import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import {search, searchNews, searchImages, searchVideos} from 'duck-duck-scrape';

export class DuckDuckGoNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DuckDuckGo Node',
		name: 'duckDuckGoNode',
		icon: 'file:duckduckgo.svg',
		group: ['transform'],
		version: 1,
		description: 'DuckDuckGo Search',
		defaults: {
			name: 'DuckDuckGo',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'search',
				required: true,
				options: [
					{
						name: 'Search',
						value: 'search',
					},
					{
						name: 'Search Images',
						value: 'search_images',
					},
					{
						name: 'Search News',
						value: 'search_news',
					},
					{
						name: 'Search Videos',
						value: 'search_videos',
					}
				],
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: ''
			},
			{
				displayName: 'Locale',
				name: 'locale',
				type: 'string',
				default: 'en-us'
			},
			{
				displayName: 'Safe Search',
				name: 'safeSearch',
				type: 'options',
				noDataExpression: true,
				default: 0,
				required: true,
				options: [
					{
						name: 'Strict',
						value: 0,
					},
					{
						name: 'Moderate',
						value: -1,
					},
					{
						name: 'Off',
						value: -2,
					}
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let operation: string;
		let query: string;
		let locale: string;
		let safeSearch: number;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				operation = this.getNodeParameter('operation', itemIndex) as string;
				query = this.getNodeParameter('query', itemIndex) as string;
				locale = this.getNodeParameter('locale', itemIndex) as string;
				safeSearch = this.getNodeParameter('safeSearch', itemIndex) as number;

				const searchOptions = {
					safeSearch: safeSearch,
					locale: locale,
				};

				if (operation === 'search') {
					let result = await search(query, searchOptions);

					for (const item of result.results ?? []) {
						returnData.push({
							json: {
								bang: item.bang,
								description: item.description,
								hostname: item.hostname,
								icon: item.icon,
								rawDescription: item.rawDescription,
								title: item.title,
								url: item.url,
							},
							pairedItem: {item: itemIndex},
						});
					}
				} else if (operation === 'search_images') {
					let result = await searchImages(query, searchOptions);

					for (const item of result.results ?? []) {
						returnData.push({
							json: {
								height: item.height,
								image: item.image,
								source: item.source,
								thumbnail: item.thumbnail,
								title: item.title,
								url: item.url,
								width: item.width,
							},
							pairedItem: {item: itemIndex},
						});
					}
				} else if (operation === 'search_news') {
					let result = await searchNews(query, searchOptions);

					for (const item of result.results ?? []) {
						returnData.push({
							json: {
								date: item.date ? new Date(item.date * 1000) : null,
								excerpt: item.excerpt,
								image: item.image,
								isOld: item.isOld,
								relativeTime: item.relativeTime,
								syndicate: item.syndicate,
								title: item.title,
								url: item.url,
							},
							pairedItem: {item: itemIndex},
						});
					}
				} else if (operation === 'search_videos') {
					let result = await searchVideos(query, searchOptions);

					for (const item of result.results ?? []) {
						returnData.push({
							json: {
								description: item.description,
								duration: item.duration,
								image: item.image,
								published: item.published,
								publishedOn: item.publishedOn,
								publisher: item.publisher,
								title: item.title,
								url: item.url,
								viewCount: item.viewCount,
							},
							pairedItem: {item: itemIndex},
						});
					}
				}


			} catch
				(error) {
				if (this.continueOnFail()) {
					items.push({json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}
