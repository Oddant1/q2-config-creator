import { parse } from 'smol-toml';

// TODO: We need acceptable toml key paths here. We need to verify anything
// under "parsl" in the toml is in the acceptable paths

class FormModel {
    configType = "local";
    formData = {
        "local": {
            "localExecutorType": "HighThroughputExecutor",
            "numTasks": ""
        },
        "slurm": {
            "maxBlocks": "",
            "walltime": "",
            "nodesPerBlock": "",
            "workersPerNode": "",
            "cpusPerNode": "",
            "cpusPerWorker": "",
            "memPerNode": "",
            "workerInit": ""
        }
    };

  //***************************************************************************
  // Start boilerplate to make this a subscribable svelte store
  //***************************************************************************
  _subscription: Record<number, (arg0: FormModel) => void> = {};
  _subscriptionNum = 0;

  _dirty() {
    for (const subscription of Object.values(this._subscription)) {
      subscription(this);
    }
  }

  subscribe(subscription: (value: FormModel) => void): () => void {
    this._subscription[this._subscriptionNum] = subscription;
    subscription(this);
    return ((index) => {
      return () => {
        delete this._subscription[index];
      };
    })(this._subscriptionNum++);
  }
  //***************************************************************************
  // End boilerplate to make this a subscribable svelte store
  //***************************************************************************

  clear() {
    this.configType = "local";
    this.formData = {
        "local": {
            "localExecutorType": "HighThroughputExecutor",
            "numTasks": ""
        },
        "slurm": {
            "maxBlocks": "",
            "walltime": "",
            "nodesPerBlock": "",
            "workersPerNode": "",
            "cpusPerNode": "",
            "cpusPerWorker": "",
            "memPerNode": "",
            "workerInit": ""
        }
    };
  }

  async readConfig(src: File) {
    this.clear();
    const reader = new FileReader();

    reader.onerror = () => {
        // TODO: Complain somehow
    };

    reader.onload = () => {
        let config = parse(reader.result as string);
        if (!config.parsl) {
            // TODO: Complain
        } else {
            // TODO: Make sure only one executor for now
            const executor = config.parsl.executors[0];

            // TODO: Validate fields properly
            if (!executor.provider || executor.provider.class === "LocalProvider") {
                this.configType = "local";
                this.formData.local.localExecutorType = executor.class;
                this.formData.local.numTasks = executor.class === "HighThroughputExecutor" ? executor.max_workers : executor.max_threads;
            } else if (executor.provider.class === "SlurmProvider") {
                this.configType = "slurm"
                this.formData.slurm.cpusPerWorker = executor.cores_per_worker ? executor.cores_per_worker : "";
                this.formData.slurm.workersPerNode = executor.max_workers_per_node ? executor.max_workers_per_node : "";

                const provider = executor.provider;
                this.formData.slurm.cpusPerNode = provider.cores_per_node ? provider.cores_per_node : "";
                this.formData.slurm.maxBlocks = provider.max_blocks ? provider.max_blocks : "";
                this.formData.slurm.memPerNode = provider.mem_per_node ? provider.mem_per_node : "";
                this.formData.slurm.nodesPerBlock = provider.nodes_per_block ? provider.nodes_per_block : "";
                this.formData.slurm.walltime = provider.walltime ? provider.walltime : "";
                this.formData.slurm.workerInit = provider.worker_init ? provider.worker_init : "";
            } else {
                // TODO: Complain
            }

            this._dirty();
        }
    }

    reader.readAsText(src);
  }
}

const formModel = new FormModel();
export default formModel;
