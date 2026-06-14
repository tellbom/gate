/**
 * 树形数据转换工具函数
 * 用于将后端返回的扁平数据（id, pid, name）转换为树形结构
 */

/**
 * 将扁平数组转换为树形结构
 * @param {Array} flatData - 扁平数组，格式: [{ id: '1', pid: '0', name: '节点1' }]
 * @param {String} rootPid - 根节点的 pid 值，默认 '0'
 * @param {Object} config - 配置项
 * @param {String} config.idKey - id 字段名，默认 'id'
 * @param {String} config.pidKey - 父id 字段名，默认 'pid'
 * @param {String} config.childrenKey - 子节点字段名，默认 'children'
 * @returns {Array} 树形结构数组
 */
export function buildTree(flatData, rootPid = '0', config = {}) {
  const {
    idKey = 'id',
    pidKey = 'pid',
    childrenKey = 'children'
  } = config

  // 创建映射表，提高查找效率
  const map = new Map()
  const tree = []

  // 第一遍遍历：创建节点映射
  flatData.forEach(item => {
    map.set(item[idKey], { ...item, [childrenKey]: [] })
  })

  // 第二遍遍历：建立父子关系
  flatData.forEach(item => {
    const node = map.get(item[idKey])
    const parentId = item[pidKey]

    if (parentId === rootPid || parentId === null || parentId === undefined) {
      // 根节点
      tree.push(node)
    } else {
      // 子节点
      const parent = map.get(parentId)
      if (parent) {
        parent[childrenKey].push(node)
      } else {
        // 找不到父节点，当作根节点处理
        tree.push(node)
      }
    }
  })

  // 清理空的 children 数组（可选）
  const cleanEmptyChildren = (nodes) => {
    nodes.forEach(node => {
      if (node[childrenKey] && node[childrenKey].length === 0) {
        delete node[childrenKey]
      } else if (node[childrenKey] && node[childrenKey].length > 0) {
        cleanEmptyChildren(node[childrenKey])
      }
    })
  }

  cleanEmptyChildren(tree)

  return tree
}

/**
 * 在树中查找节点
 * @param {Array} tree - 树形数据
 * @param {String} id - 要查找的节点 id
 * @param {String} idKey - id 字段名
 * @param {String} childrenKey - 子节点字段名
 * @returns {Object|null} 找到的节点或 null
 */
export function findNodeInTree(tree, id, idKey = 'id', childrenKey = 'children') {
  for (const node of tree) {
    if (node[idKey] === id) {
      return node
    }
    if (node[childrenKey] && node[childrenKey].length > 0) {
      const found = findNodeInTree(node[childrenKey], id, idKey, childrenKey)
      if (found) return found
    }
  }
  return null
}

/**
 * 获取节点的所有父节点 ID
 * @param {Array} flatData - 扁平数组
 * @param {String} id - 节点 id
 * @param {String} idKey - id 字段名
 * @param {String} pidKey - 父id 字段名
 * @returns {Array} 父节点 ID 数组（从根到父）
 */
export function getParentIds(flatData, id, idKey = 'id', pidKey = 'pid') {
  const result = []
  const map = new Map()

  flatData.forEach(item => {
    map.set(item[idKey], item)
  })

  let current = map.get(id)
  while (current && current[pidKey] && current[pidKey] !== '0') {
    result.unshift(current[pidKey])
    current = map.get(current[pidKey])
  }

  return result
}

/**
 * 获取节点的完整路径（包括节点自身）
 * @param {Array} flatData - 扁平数组
 * @param {String} id - 节点 id
 * @param {String} idKey - id 字段名
 * @param {String} pidKey - 父id 字段名
 * @param {String} nameKey - 名称字段名
 * @returns {String} 路径字符串，如 "新闻中心 / 国内新闻 / 政治"
 */
export function getNodePath(flatData, id, idKey = 'id', pidKey = 'pid', nameKey = 'name') {
  const map = new Map()
  flatData.forEach(item => {
    map.set(item[idKey], item)
  })

  const path = []
  let current = map.get(id)
  
  while (current) {
    path.unshift(current[nameKey])
    if (current[pidKey] === '0' || !current[pidKey]) break
    current = map.get(current[pidKey])
  }

  return path.join(' / ')
}

/**
 * 树形数据扁平化
 * @param {Array} tree - 树形数据
 * @param {String} childrenKey - 子节点字段名
 * @returns {Array} 扁平化数组
 */
export function flattenTree(tree, childrenKey = 'children') {
  const result = []
  
  const flatten = (nodes) => {
    nodes.forEach(node => {
      const { [childrenKey]: children, ...rest } = node
      result.push(rest)
      if (children && children.length > 0) {
        flatten(children)
      }
    })
  }

  flatten(tree)
  return result
}

/**
 * 过滤树（保留符合条件的节点及其祖先节点）
 * @param {Array} tree - 树形数据
 * @param {Function} predicate - 过滤函数
 * @param {String} childrenKey - 子节点字段名
 * @returns {Array} 过滤后的树
 */
export function filterTree(tree, predicate, childrenKey = 'children') {
  return tree.reduce((acc, node) => {
    const children = node[childrenKey]
    const filteredChildren = children ? filterTree(children, predicate, childrenKey) : []
    
    if (predicate(node) || filteredChildren.length > 0) {
      acc.push({
        ...node,
        [childrenKey]: filteredChildren.length > 0 ? filteredChildren : undefined
      })
    }
    
    return acc
  }, [])
}

// 使用示例
/*
// 1. 基本使用
const flatData = [
  { id: '1', pid: '0', name: '新闻中心' },
  { id: '2', pid: '1', name: '国内新闻' },
  { id: '3', pid: '1', name: '国际新闻' },
  { id: '4', pid: '2', name: '政治' },
  { id: '5', pid: '2', name: '经济' },
]

const tree = buildTree(flatData)
console.log(tree)

// 2. 自定义字段名
const customData = [
  { code: '1', parentCode: '0', title: '节点1' },
  { code: '2', parentCode: '1', title: '节点2' },
]

const customTree = buildTree(customData, '0', {
  idKey: 'code',
  pidKey: 'parentCode',
  childrenKey: 'kids'
})

// 3. 查找节点
const node = findNodeInTree(tree, '2')
console.log(node)

// 4. 获取父节点 IDs
const parentIds = getParentIds(flatData, '4')
console.log(parentIds) // ['1', '2']

// 5. 获取节点路径
const path = getNodePath(flatData, '4')
console.log(path) // "新闻中心 / 国内新闻 / 政治"

// 6. 过滤树
const filtered = filterTree(tree, node => node.name.includes('国'))
console.log(filtered)
*/