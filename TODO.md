# Development - missing features
- <b>Object pools</b>: entity recycling system for memory efficiency
- <b>Scene management</b>: allow switching betweeen multiple scenes, each of which have their own entity subsets.
- <b>More collection types</b>: 
    - <b>SortedList</b>: like ArrayList but auto-sorting based on a criteria
    - <b>LinkedList</b>: cyclic list that keeps track of one current value, and allow the efficient insertion and deletion of nodes.
    - <b>Grid2D</b>: Space partitioning data structure that divides entities into disjoint and uniform rectangular regions based on a positioning criteria.
# Testing
- Namespace resolution having two or more addons
- Performance testing at object pools when deleting and creating many entities