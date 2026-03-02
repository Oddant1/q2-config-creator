import { stringify, parse } from 'smol-toml';

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

  async readConfig(src: File) {
    const reader = new FileReader();

    reader.onerror = () => {
        // TODO: Complain somehow
    };

    reader.onload = () => {
        let config = parse(reader.result as string);
        console.log(config)
        console.log(stringify(config))
    }

    reader.readAsText(src);
  }
}

const formModel = new FormModel();
export default formModel;
