<script lang="ts">
	import { stringify } from 'smol-toml';

	import DropZone from '$lib/components/DropZone.svelte';
	import formModel from '$lib/models/formModel';
	import NavBanner from '$lib/components/NavBanner.svelte';

	async function writeConfig(event: SubmitEvent) {
		event.preventDefault();

		let tomlString = '';
		// Shared info across all configs we might write
		const jsonConfig = { parsl: { executors: [{ name: 'default' }] } };

		switch (formModel.configType) {
			case 'local':
				_createLocalConfigJson(jsonConfig);
				// Header not needed here due to strategy = "None" being a key
				// value pair directly under parsl
				break;
			case 'slurm':
				_createSlurmConfigJson(jsonConfig);
				// This header bit isn't added in this case
				tomlString = '[parsl]\n\n' + tomlString;
				break;
			default:
				// TODO: Complain
				break;
		}

		tomlString += stringify(jsonConfig);

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

	function _createLocalConfigJson(jsonConfig: any) {
		jsonConfig.parsl['strategy'] = 'None';
		const executor = jsonConfig.parsl.executors[0];
		executor['class'] = formModel.formData.local.localExecutorType;

		switch (formModel.formData.local.localExecutorType) {
			case 'HighThroughputExecutor':
				executor['max_workers'] = formModel.formData.local.numTasks;
				executor['provider'] = { class: 'LocalProvider' };
				break;
			case 'ThreadPoolExecutor':
				executor['max_threads'] = formModel.formData.local.numTasks;
				break;
			default:
				// TODO: Complain
				break;
		}
	}

	function _createSlurmConfigJson(jsonConfig: any) {
		const executor = jsonConfig.parsl.executors[0];
		executor['class'] = 'HighThroughputExecutor';
		executor['cores_per_worker'] = formModel.formData.slurm.cpusPerWorker;
		executor['max_workers_per_node'] = formModel.formData.slurm.workersPerNode;

		executor['provider'] = {
			class: 'SlurmProvider',
			max_blocks: formModel.formData.slurm.maxBlocks,
			nodes_per_block: formModel.formData.slurm.nodesPerBlock,
			cores_per_node: formModel.formData.slurm.cpusPerNode,
			mem_per_node: formModel.formData.slurm.memPerNode,
			walltime: formModel.formData.slurm.walltime,
			// TODO: Do we want to hardcode this?
			exclusive: false,
			worker_init: formModel.formData.slurm.workerInit
		};
	}
</script>

<header class="fixed top-0 right-0 left-0 z-10">
	<NavBanner />
</header>
<div class="positioned-container">
	<div class="flex items-center">
		<span class="mx-auto text-4xl font-bold text-black">QIIME 2 Parallel Config Creator</span>
	</div>
	<main class="max-width pt-5 pb-5">
		<p class="pb-4">
			QIIME 2 features the ability to parallelize all QIIME 2 Pipelines using the PARSL parallel
			scripting library under the hood. Running small workflows in parallel on a laptop requires
			minimal configuration, and can be achieved by simply passing the --p-parallel flag to the
			pipeline you are running without additional configuration; however, QIIME 2 also support
			parallelizing large scale workflows across multiple nodes on a compute cluster. This is
			particularly useful for pipelines in MOSHPIT and q2-boots which often do the same type of
			calculation a very large number of times on a large set of data.
		</p>
		<p class="pb-4">
			This webapp can help you create a file to pass into the --p-parallel-config parameter of a
			QIIME 2 Pipeline you want to run in parallel on an HPC cluster using the Slurm scheduler.
			PARSL and thus QIIME 2 do support schedulers other than slurm, but this app currently only
			supports creating local and Slurm configs. More information about QIIME 2 parallel configuration may be
			found
			<a
				href="https://use.qiime2.org/en/stable/references/parallel-configuration.html"
				target="_blank"
				rel="noreferrer">here</a
			>.
		</p>

		<DropZone />

		<section class="mt-6 rounded border border-gray-300 bg-white p-4 shadow-sm">
			<h2 class="pb-2 font-bold">Create a configuration</h2>
			<p class="pb-4 text-gray-700">
				Fill out the fields below to create a `parallelConfig.toml` file you can pass to QIIME 2.
			</p>

			<!-- TODO: Disable this in some way while parsing a user input file (shouldn't take long) -->
			<form class="grid" onsubmit={writeConfig}>
				{#key $formModel.configType}
					<div>
						<label class="text-sm font-bold text-gray-700" for="pcType">
							What type of computer are you using?
						</label>
						<p class="text-sm text-gray-500">
							Currently, this config creator only supports local execution and Slurm.
							Choose local if parallelizing on your own laptop/desktop/server.
							Choose Slurm if parallelizing on an HPC using the Slurm scheduler.
						</p>
						<select
							id="pcType"
							name="pcType"
							class="roundInput w-full"
							bind:value={formModel.configType}
						>
							<option value="local">local</option>
							<option value="slurm">Slurm</option>
						</select>
					</div>

					{#if formModel.configType == 'local'}
						<div>
							<label class="text-sm font-bold text-gray-700" for="localExecutorType">
								Is the Pipeline you are running threadsafe?
							</label>
							<p class="text-sm text-gray-500">
								If you are unsure, choose “No”.
							</p>
							<select
								id="localExecutorType"
								name="localExecutorType"
								class="roundInput w-full"
								bind:value={formModel.formData.local.localExecutorType}
							>
								<option value="HighThroughputExecutor">No</option>
								<option value="ThreadpoolExecutor">Yes</option>
							</select>
						</div>
						<div>
							<label class="text-sm font-bold text-gray-700" for="numTasks">
								How many threads/processes would you like to run?
							</label>
							<p class="text-sm text-gray-500">
								How many threads to run simultaneously if your task is threadsafe and how many processes to run simultaneously if it isn't.
							</p>
							<p class="text-sm text-gray-500">
								NOTE: More threads/processes requires more RAM.
							</p>
							<input
								id="numTasks"
								class="roundInput w-full"
								bind:value={formModel.formData.local.numTasks}
								type="number"
								min="1"
								pattern="\d*"
								required
							/>
						</div>
					{:else}
						<div>
							<label class="text-sm font-bold text-gray-700" for="maxBlocks">
								How many blocks do you want to create?
							</label>
							<p class="text-sm text-gray-500">
								This specifies the maximum number of blocks to be provisioned.
								Each block is one Slurm job.
								Each job requests the amount of resources you specify below for itself.
							</p>
							<input
								id="maxBlocks"
								class="roundInput w-full"
								bind:value={formModel.formData.slurm.maxBlocks}
								type="number"
								min="1"
								pattern="\d*"
								required
							/>
						</div>
						<div>
							<label class="text-sm font-bold text-gray-700" for="nodesPerBlock">
								How many nodes per block?
							</label>
							<p class="text-sm text-gray-500">
								This specifies the number of compute nodes each Slurm job will request.
							</p>
							<input
								id="nodesPerBlock"
								class="roundInput w-full"
								bind:value={formModel.formData.slurm.nodesPerBlock}
								type="number"
								min="1"
								pattern="\d*"
								required
							/>
						</div>
						<div>
							<label class="text-sm font-bold text-gray-700" for="cpusPerNode">
								How many CPUs per node?
							</label>
							<p class="text-sm text-gray-500">
								This specifies the number of CPUs the Slurm jobs will request per node.
							</p>
							<input
								id="cpusPerNode"
								class="roundInput w-full"
								bind:value={formModel.formData.slurm.cpusPerNode}
								type="number"
								min="1"
								pattern="\d*"
								required
							/>
						</div>
						<div>
							<label class="text-sm font-bold text-gray-700" for="memPerNode">
								How much RAM per node (GB)?
							</label>
							<p class="text-sm text-gray-500">
								This specifies the amount of RAM the Slurm jobs will request per node in Gigabytes.
							</p>
							<input
								id="memPerNode"
								class="roundInput w-full"
								bind:value={formModel.formData.slurm.memPerNode}
								type="number"
								min="1"
								pattern="\d*"
								required
							/>
						</div>
						<div>
							<label class="text-sm font-bold text-gray-700" for="workerPerNode">
								How many workers per node?
							</label>
							<p class="text-sm text-gray-500">
								Each worker can handle one task, one QIIME 2 action, at a time.
								The workers on a node share the resources provisioned on the node.
							</p>
							<input
								id="workerPerNode"
								class="roundInput w-full"
								bind:value={formModel.formData.slurm.workersPerNode}
								type="number"
								min="1"
								pattern="\d*"
								required
							/>
						</div>
						<div>
							<label class="text-sm font-bold text-gray-700" for="cpusPerWorker">
								How many CPUs per worker?
							</label>
							<p class="text-sm text-gray-500">
								This specifies how many CPUs each worker on the node will have access to.
								In general, this should be set to match CPUs per node / Workers per node
							</p>
							<input
								id="cpusPerWorker"
								class="roundInput w-full"
								bind:value={formModel.formData.slurm.cpusPerWorker}
								type="number"
								min="1"
								pattern="\d*"
								required
							/>
						</div>
						<div>
							<label class="text-sm font-bold text-gray-700" for="walltime">
								Target walltime (HH:MM:SS)
							</label>
							<p class="text-sm text-gray-500">
								This specifies the walltime each Slurm job will request.
							</p>
							<input
								id="walltime"
								class="roundInput w-full"
								bind:value={formModel.formData.slurm.walltime}
								pattern="\d*:\d\d:\d\d"
								placeholder="HH:MM:SS"
								required
							/>
						</div>
						<div>
							<label class="text-sm font-bold text-gray-700" for="workerInit">
								What commands activate QIIME 2?
							</label>
							<p class="text-sm text-gray-500">
								This is the commands needed to load your QIIME 2 environment from a fresh terminal.
								Separate multiple commands with `;`.
							</p>
							<input
								id="workerInit"
								class="roundInput w-full"
								bind:value={formModel.formData.slurm.workerInit}
								placeholder="module load anaconda3; conda activate qiime2-amplicon-dev;"
								required
							/>
						</div>
					{/if}

					<div
						class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4"
					>
						<p class="text-xs text-gray-500">Your config will download as `parallelConfig.toml`.</p>
						<button class="config-button" type="submit">Generate Config</button>
					</div>
				{/key}
			</form>
		</section>
	</main>
</div>
