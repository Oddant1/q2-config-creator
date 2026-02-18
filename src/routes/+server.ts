import { stringify, type JsonMap } from '@iarna/toml';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	let json: JsonMap = {};

	const data = await event.request.formData();
	json.pcType = data.get('pcType');
	const tomlString = stringify(json);
	const blob = new Blob([tomlString]);

	return new Response(blob, {
		status: 200,
		headers: {
			'Content-type': 'application/toml',
			'Content-Disposition': `attachment; filename=parallelConfig.toml`
		}
	});
};
