function initCollapsibleSections(markdownBodyElement) {
            // Event delegation for clicks and keydown events on H1 elements
            markdownBodyElement.addEventListener('click', function(event) {
                const h1 = event.target.closest('h1');
                if (h1 && markdownBodyElement.contains(h1)) { // Ensure h1 is within this markdownBody
                    toggleSection(h1);
                }
            });

            markdownBodyElement.addEventListener('keydown', function(event) {
                const h1 = event.target.closest('h1');
                if (h1 && markdownBodyElement.contains(h1) && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault(); // Prevent page scroll on Space
                    toggleSection(h1);
                }
            });

            // Make H1s focusable and set initial state (optional: can start collapsed)
            const h1s = markdownBodyElement.querySelectorAll('main > * > h1'); // More specific: thk > h1, txt > h1 etc.
            h1s.forEach(h1 => {
                h1.setAttribute('tabindex', '0'); // Make focusable
                h1.setAttribute('role', 'button'); // ARIA role
                h1.setAttribute('aria-expanded', 'true'); // Initial state: expanded
                // If you want to start collapsed by default:
                // toggleSection(h1, true); // true to force collapse
            });
        }

        function toggleSection(h1Element, forceCollapse = false) {
            const contentElement = h1Element.nextElementSibling;
            if (contentElement && (contentElement.tagName === 'DIV' || contentElement.tagName === 'UL' || contentElement.tagName === 'OL')) {
                const isCurrentlyCollapsed = h1Element.classList.contains('is-collapsed');
                
                if (forceCollapse) {
                    h1Element.classList.add('is-collapsed');
                    h1Element.setAttribute('aria-expanded', 'false');
                } else if (isCurrentlyCollapsed) {
                    h1Element.classList.remove('is-collapsed');
                    h1Element.setAttribute('aria-expanded', 'true');
                } else {
                    h1Element.classList.add('is-collapsed');
                    h1Element.setAttribute('aria-expanded', 'false');
                }
            }
        }

        // Initialize for existing .markdown-body elements on page load
        document.querySelectorAll('.markdown-body').forEach(initCollapsibleSections);

        // MutationObserver to detect new .markdown-body elements
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node itself is a .markdown-body
                            if (node.matches && node.matches('.markdown-body')) {
                                initCollapsibleSections(node);
                            }
                            // Or if it contains .markdown-body elements
                            const newMarkdownBodies = node.querySelectorAll('.markdown-body');
                            newMarkdownBodies.forEach(initCollapsibleSections);
                        }
                    });
                }
            }
        });

        // Start observing the document body for added child elements
        observer.observe(document.body, { childList: true, subtree: true });

        // --- Demo: Add new message ---
        const addMessageBtn = document.getElementById('addMessageBtn');
        if (addMessageBtn) {
            addMessageBtn.onclick = function() {
                const originalMessage = document.getElementById('ai-chat-answer');
                if (originalMessage) {
                    const newMessage = originalMessage.cloneNode(true);
                    // To make it slightly different for demo purposes
                    const newId = 'ai-chat-answer-' + Date.now();
                    newMessage.id = newId;
                    const h1sInNew = newMessage.querySelectorAll('.markdown-body h1');
                    if (h1sInNew.length > 0) {
                         h1sInNew[0].textContent = "新消息思考区";
                    }
                    if (h1sInNew.length > 1) {
                         h1sInNew[1].textContent = "新消息开局";
                    }
                    // Remove is-collapsed from new H1s to reset state (if they were cloned collapsed)
                    newMessage.querySelectorAll('.markdown-body h1.is-collapsed').forEach(h1 => {
                        h1.classList.remove('is-collapsed');
                        h1.setAttribute('aria-expanded', 'true');
                    });

                    document.body.insertBefore(newMessage, addMessageBtn);
                    // The MutationObserver should automatically pick up the new .markdown-body
                    // and apply the collapsible logic.
                }
            }
        }