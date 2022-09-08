import { describe, expect, test } from 'vitest'

import {
  accountProvider,
  accounts,
  initialBlockNumber,
  networkProvider,
  testProvider,
} from '../../../test/utils'
import { etherToValue } from '../../utils'
import { fetchBlock } from '../block'
import { sendTransaction } from '../transaction'
import { mine } from '../test'
import { setBalance } from '../test/setBalance'
import { fetchTransaction } from './fetchTransaction'

const sourceAccount = accounts[0]
const targetAccount = accounts[1]

test('fetches transaction', async () => {
  await setBalance(testProvider, {
    address: targetAccount.address,
    value: targetAccount.balance,
  })

  await sendTransaction(accountProvider, {
    request: {
      from: sourceAccount.address,
      to: targetAccount.address,
      value: etherToValue('1'),
    },
  })

  await mine(testProvider, { blocks: 1 })

  const transaction = await fetchTransaction(networkProvider, {
    blockTag: 'latest',
    index: 0,
  })
  expect(Object.keys(transaction)).toMatchInlineSnapshot(`
    [
      "blockHash",
      "blockNumber",
      "from",
      "gas",
      "hash",
      "input",
      "nonce",
      "r",
      "s",
      "to",
      "transactionIndex",
      "v",
      "value",
      "accessList",
      "maxFeePerGas",
      "maxPriorityFeePerGas",
      "type",
    ]
  `)
  expect(transaction.type).toMatchInlineSnapshot('"eip1559"')
  expect(transaction.from).toMatchInlineSnapshot(
    '"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"',
  )
  expect(transaction.gas).toBeDefined()
  expect(transaction.transactionIndex).toMatchInlineSnapshot('0n')
  expect(transaction.to).toMatchInlineSnapshot(
    '"0x70997970c51812dc3a010c7d01b50e0d17dc79c8"',
  )
  expect(transaction.value).toMatchInlineSnapshot('1000000000000000000n')
})

test('fetches transaction (legacy)', async () => {
  const block = await fetchBlock(networkProvider)

  await setBalance(testProvider, {
    address: targetAccount.address,
    value: targetAccount.balance,
  })

  await sendTransaction(accountProvider, {
    request: {
      from: sourceAccount.address,
      to: targetAccount.address,
      value: etherToValue('1'),
      gasPrice: BigInt(block.baseFeePerGas ?? 0),
    },
  })

  await mine(testProvider, { blocks: 1 })

  const transaction = await fetchTransaction(networkProvider, {
    blockTag: 'latest',
    index: 0,
  })
  expect(Object.keys(transaction)).toMatchInlineSnapshot(`
    [
      "blockHash",
      "blockNumber",
      "from",
      "gas",
      "hash",
      "input",
      "nonce",
      "r",
      "s",
      "to",
      "transactionIndex",
      "v",
      "value",
      "accessList",
      "gasPrice",
      "type",
    ]
  `)
  expect(transaction.type).toMatchInlineSnapshot('"legacy"')
  expect(transaction.from).toMatchInlineSnapshot(
    '"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"',
  )
  expect(transaction.gas).toBeDefined()
  expect(transaction.transactionIndex).toMatchInlineSnapshot('0n')
  expect(transaction.to).toMatchInlineSnapshot(
    '"0x70997970c51812dc3a010c7d01b50e0d17dc79c8"',
  )
  expect(transaction.value).toMatchInlineSnapshot('1000000000000000000n')
})

test('fetches transaction (eip2930)', async () => {
  const block = await fetchBlock(networkProvider)

  await setBalance(testProvider, {
    address: targetAccount.address,
    value: targetAccount.balance,
  })

  await sendTransaction(accountProvider, {
    request: {
      accessList: [{ address: targetAccount.address, storageKeys: [] }],
      from: sourceAccount.address,
      to: targetAccount.address,
      value: etherToValue('1'),
      gasPrice: BigInt(block.baseFeePerGas ?? 0),
    },
  })

  await mine(testProvider, { blocks: 1 })

  const transaction = await fetchTransaction(networkProvider, {
    blockTag: 'latest',
    index: 0,
  })
  expect(Object.keys(transaction)).toMatchInlineSnapshot(`
    [
      "blockHash",
      "blockNumber",
      "from",
      "gas",
      "hash",
      "input",
      "nonce",
      "r",
      "s",
      "to",
      "transactionIndex",
      "v",
      "value",
      "accessList",
      "gasPrice",
      "type",
    ]
  `)
  expect(transaction.type).toMatchInlineSnapshot('"eip2930"')
  expect(transaction.from).toMatchInlineSnapshot(
    '"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"',
  )
  expect(transaction.gas).toBeDefined()
  expect(transaction.transactionIndex).toMatchInlineSnapshot('0n')
  expect(transaction.to).toMatchInlineSnapshot(
    '"0x70997970c51812dc3a010c7d01b50e0d17dc79c8"',
  )
  expect(transaction.value).toMatchInlineSnapshot('1000000000000000000n')
})

describe('args: hash', () => {
  test('fetches transaction by hash', async () => {
    const { hash } = await sendTransaction(accountProvider, {
      request: {
        from: sourceAccount.address,
        to: targetAccount.address,
        value: etherToValue('3'),
      },
    })

    await mine(testProvider, { blocks: 1 })

    const transaction = await fetchTransaction(networkProvider, {
      hash,
    })
    expect(transaction.from).toMatchInlineSnapshot(
      '"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"',
    )
    expect(transaction.gas).toBeDefined()
    expect(transaction.transactionIndex).toMatchInlineSnapshot('0n')
    expect(transaction.to).toMatchInlineSnapshot(
      '"0x70997970c51812dc3a010c7d01b50e0d17dc79c8"',
    )
    expect(transaction.value).toMatchInlineSnapshot('3000000000000000000n')
  })

  test('throws if transaction not found', async () => {
    await expect(
      fetchTransaction(networkProvider, {
        hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
      }),
    ).rejects.toThrowError(
      'Transaction with hash "0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d" could not be found.',
    )
  })
})

describe('args: blockHash', () => {
  test('blockHash: fetches transaction by block hash & index', async () => {
    const { hash: blockHash } = await fetchBlock(networkProvider, {
      blockNumber: initialBlockNumber - 69,
    })

    if (!blockHash) throw new Error('no block hash found')
    const transaction = await fetchTransaction(networkProvider, {
      blockHash,
      index: 5,
    })
    expect(transaction.from).toMatchInlineSnapshot(
      '"0xd4bddf5e3d0435d7a6214a0b949c7bb58621f37c"',
    )
    expect(transaction.gas).toMatchInlineSnapshot('250000n')
    expect(transaction.transactionIndex).toMatchInlineSnapshot('5n')
    expect(transaction.to).toMatchInlineSnapshot(
      '"0x3845badade8e6dff049820680d1f14bd3903a5d0"',
    )
    expect(transaction.value).toMatchInlineSnapshot('0n')
  }, 10000)

  test('blockHash: throws if transaction not found', async () => {
    const { hash: blockHash } = await fetchBlock(networkProvider, {
      blockNumber: initialBlockNumber - 69,
    })
    if (!blockHash) throw new Error('no block hash found')

    await expect(
      fetchTransaction(networkProvider, {
        blockHash,
        index: 420,
      }),
    ).rejects.toThrowError('Transaction at block hash')
  })
})

describe('args: blockNumber', () => {
  test('fetches transaction by block number & index', async () => {
    const transaction = await fetchTransaction(networkProvider, {
      blockNumber: initialBlockNumber - 420,
      index: 5,
    })
    expect(transaction.from).toMatchInlineSnapshot(
      '"0xc937580291f30d7d25174df96b31f9649d346d9c"',
    )
    expect(transaction.gas).toMatchInlineSnapshot('62230n')
    expect(transaction.transactionIndex).toMatchInlineSnapshot('5n')
    expect(transaction.to).toMatchInlineSnapshot(
      '"0xdac17f958d2ee523a2206206994597c13d831ec7"',
    )
    expect(transaction.value).toMatchInlineSnapshot('0n')
  }, 10000)

  test('throws if transaction not found', async () => {
    await expect(
      fetchTransaction(networkProvider, {
        blockNumber: initialBlockNumber - 420,
        index: 420,
      }),
    ).rejects.toThrowError(
      'Transaction at block number "15131580" at index "420" could not be found.',
    )
  })
})