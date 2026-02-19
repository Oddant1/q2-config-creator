<script lang="ts">
	import { stringify } from 'smol-toml';

	async function getConfig(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
		event.preventDefault();

		const json = {
			'parsl': {'strategy': 'None'}
		}
		const data = new FormData(event.currentTarget);

		json.parsl.pcType = data.get('pcType');
		json.parsl.num = 1

		const tomlString = stringify(json);

		const blob: Blob = new Blob([tomlString]);
		const blobUrl = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = blobUrl;
		link.download = 'parallelConfig.toml';

		document.body.appendChild(link);

		link.dispatchEvent(
			new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
				view: window
			})
		);

		document.body.removeChild(link);
		URL.revokeObjectURL(blobUrl);
	}
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

QIIME 2 features the ability to parallelize all QIIME 2 Pipelines using the PARSL parallel scripting
library under the hood. This is particularly useful for pipelines in MOSHPIT and q2-boots which
often do the same type of calculation a very large number of times on a large set of data.

<form onsubmit={getConfig}>
	<label for="pcType">What type of computer are you using?</label>
	<select name="pcType">
		<option value="HPC">HPC</option>
		<option value="local">local</option>
	</select>
	<br /><br />
	<button>Generate Config</button>
</form>

<!-- For creating the actual action submission? -->
<!-- <form> -->
<!-- Set this to cores_per_block / workers_per_block -->
Does your action have a --p-threads param?
<!-- Set this to same as max-blocks -->
Does your action have a --p-partitions param?
<!-- </form> -->

<!-- For creating the parallel config -->
<!-- <form> -->
<!-- Are you running on an hpc? Y/N -->
<!-- Y -->
<!-- Are you using slurm? Y/N -->
<!-- Y -->
<!-- Sets max_blocks -->
How many slurm jobs do you want to submit?
<!-- Sets nodes_per_block -->
How many nodes do you want each job to use?
<!-- Sets cores_per_node -->
How many CPUs do you want per node? NOTE: If the action you are running has a parallel param you will
want to set it such that it actually uses all CPUs. In general, this can be accomplished by setting the
parallel parameter to the action to cores_per_worker / workers_per_node
<!-- Sets mem_per_node -->
How much memory in GB do you want per node?
<!-- Sets walltime -->
How long do you expect the job to take?
<!-- Sets the worker_init -->
What commands do you need to run to activate your QIIME 2 environment? These commands will be run on the
compute node(s) to activate QIIME 2
<!-- N -->
<!-- Currently only supports detailed support for slurm -->
<!-- N -->
Is the action you are running threadsafe? If you don't know the answer to this, choose no. How many CPUs
do you have?
<!-- ... -->
<!-- </form> -->
