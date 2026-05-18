const reads: (() => void)[] = [];
const writes: (() => void)[] = [];
let scheduled = false;

function runTasks() {
  scheduled = false;

  // Run all reads first
  const currentReads = reads.slice();
  reads.length = 0;
  for (let i = 0; i < currentReads.length; i++) {
    try {
      currentReads[i]();
    } catch (e) {
      console.error(e);
    }
  }

  // Run all writes next
  const currentWrites = writes.slice();
  writes.length = 0;
  for (let i = 0; i < currentWrites.length; i++) {
    try {
      currentWrites[i]();
    } catch (e) {
      console.error(e);
    }
  }
}

function scheduleFrame() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(runTasks);
  }
}

export const FastDOM = {
  read(cb: () => void) {
    reads.push(cb);
    scheduleFrame();
  },

  write(cb: () => void) {
    writes.push(cb);
    scheduleFrame();
  },

  clear(cb: () => void) {
    const readIndex = reads.indexOf(cb);
    if (readIndex !== -1) {
      reads.splice(readIndex, 1);
      return;
    }
    const writeIndex = writes.indexOf(cb);
    if (writeIndex !== -1) {
      writes.splice(writeIndex, 1);
    }
  }
};
